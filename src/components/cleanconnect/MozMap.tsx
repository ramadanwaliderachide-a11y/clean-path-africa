import { MOZ_BOUNDS, PROVINCES } from "@/data/moz-provinces";
import type { CCRoute } from "@/lib/cc-fleet";

const { minLat, maxLat, minLng, maxLng } = MOZ_BOUNDS;
const W = 100;
const H = 150;

export const px = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * W;
export const py = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * H;

const STATUS_COLOR: Record<CCRoute["status"], string> = {
  Planeada: "bg-[#F5A623]/20 text-[#8a5b00]",
  "Em curso": "bg-green-100 text-green-700",
  Concluída: "bg-[#0A2342]/10 text-[#0A2342]",
};

/** Mapa real de Moçambique com as 11 províncias e a rota sobreposta. */
export function MozMap({ route, compact = false }: { route: CCRoute; compact?: boolean }) {
  const stopsPath = route.stops.map((s) => `${px(s.lng)},${py(s.lat)}`).join(" ");
  const active = new Set(route.stops.map((s) => s.province));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm md:text-base">Rastreamento — {route.code}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[route.status]}`}>{route.status}</span>
      </div>
      <div className="relative w-full rounded-xl overflow-hidden bg-[#E8F1F6] border border-[#0A2342]/10">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {PROVINCES.map((p) =>
            p.rings.map((ring, i) => (
              <polygon
                key={`${p.name}-${i}`}
                points={ring.map(([lng, lat]) => `${px(lng)},${py(lat)}`).join(" ")}
                fill={active.has(p.name) ? "#0D5E3E" : "#DCEBE1"}
                fillOpacity={active.has(p.name) ? 0.35 : 1}
                stroke="#0A2342"
                strokeOpacity="0.35"
                strokeWidth="0.25"
              />
            )),
          )}
          {!compact &&
            PROVINCES.map((p) => (
              <text
                key={`t-${p.name}`}
                x={px(p.center.lng)}
                y={py(p.center.lat)}
                textAnchor="middle"
                fontSize="1.9"
                fill="#0A2342"
                fillOpacity="0.6"
                fontWeight="700"
              >
                {p.name}
              </text>
            ))}
          {route.stops.length > 1 && (
            <polyline points={stopsPath} fill="none" stroke="#0D5E3E" strokeWidth="0.5" strokeDasharray="1.5 1" />
          )}
          {route.stops.map((s, i) => (
            <g key={s.id}>
              <title>{`${s.client} — ${s.address}`}</title>
              <circle
                cx={px(s.lng)}
                cy={py(s.lat)}
                r="1.7"
                fill={s.done ? "#0D5E3E" : "#FFFFFF"}
                stroke="#0A2342"
                strokeWidth="0.3"
              />
              <text
                x={px(s.lng)}
                y={py(s.lat) + 0.6}
                textAnchor="middle"
                fontSize="1.6"
                fontWeight="800"
                fill={s.done ? "#FFFFFF" : "#0A2342"}
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-lg transition-all duration-1000 ease-linear drop-shadow"
          style={{ left: `${(px(route.position.lng) / W) * 100}%`, top: `${(py(route.position.lat) / H) * 100}%` }}
          title="Viatura"
        >
          🚛
        </div>
      </div>
      <p className="text-xs text-[#0A2342]/50 mt-2">
        Mapa de Moçambique · posição da viatura actualizada a cada 2,5 s enquanto a rota estiver em curso.
      </p>
    </div>
  );
}
