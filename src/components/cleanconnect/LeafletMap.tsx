import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapMarker = { id: string; lat: number; lng: number; label: string; color?: string };

type Props = {
  markers?: MapMarker[];
  picked?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  height?: number;
  center?: [number, number];
};

const MAPUTO: [number, number] = [-25.9692, 32.5732];

export default function LeafletMap({ markers = [], picked, onPick, height = 400, center = MAPUTO }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || mapRef.current) return;
      const L = (mod as any).default ?? mod;
      LRef.current = L;
      const map = L.map(el.current).setView(center, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      map.on("click", (e: any) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
      setTimeout(() => map.invalidateSize(), 100);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    const pts: [number, number][] = [];
    for (const m of markers) {
      L.circleMarker([m.lat, m.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: m.color ?? "#0D5E3E",
        fillOpacity: 0.95,
      })
        .bindPopup(m.label)
        .addTo(layer);
      pts.push([m.lat, m.lng]);
    }
    if (picked) {
      L.circleMarker([picked.lat, picked.lng], {
        radius: 11,
        color: "#0A2342",
        weight: 3,
        fillColor: "#F5A623",
        fillOpacity: 1,
      }).addTo(layer);
    }
    if (pts.length > 1) mapRef.current.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    else if (pts.length === 1) mapRef.current.setView(pts[0], 14);
  }

  useEffect(draw, [markers, picked]);

  return <div ref={el} style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden z-0" />;
}
