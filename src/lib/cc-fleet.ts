import { useEffect, useState } from "react";
import { getUser, isAdmin, type CCSchedule } from "./cc-auth";

export type CCDriver = {
  id: string;
  name: string;
  phone: string;
  license: string;
  vehiclePlate: string;
  vehicleModel: string;
  capacity: string;
  active: boolean;
  createdAt: string;
};

export type CCStop = {
  id: string;
  client: string;
  address: string;
  lat: number;
  lng: number;
  scheduleId?: string;
  done: boolean;
};

export type CCRouteStatus = "Planeada" | "Em curso" | "Concluída";

export type CCRoute = {
  id: string;
  code: string;
  name: string;
  zone: string;
  date: string;
  driverId: string;
  status: CCRouteStatus;
  stops: CCStop[];
  position: { lat: number; lng: number };
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
};

const DRIVERS_KEY = "cc:drivers";
const ROUTES_KEY = "cc:routes";

// Área operacional (Maputo) usada para o mapa de rastreamento
export const MAPUTO_BOUNDS = { minLat: -26.0, maxLat: -25.87, minLng: 32.53, maxLng: 32.66 };
const DEPOT = { lat: -25.9655, lng: 32.5832 };

function safeGet<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const v = window.localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
}
function safeSet<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {}
  window.dispatchEvent(new Event("cc:data"));
}
function requireAdmin() {
  if (!isAdmin(getUser())) throw new Error("Acesso negado: apenas administradores");
}

// ----- Motoristas -----
export function getDrivers(): CCDriver[] {
  return safeGet<CCDriver[]>(DRIVERS_KEY, []);
}

export function addDriver(d: Omit<CCDriver, "id" | "createdAt" | "active">) {
  requireAdmin();
  const list = getDrivers();
  if (list.some((x) => x.vehiclePlate.toLowerCase() === d.vehiclePlate.toLowerCase()))
    throw new Error("Já existe um motorista com esta matrícula");
  list.unshift({ ...d, id: crypto.randomUUID(), active: true, createdAt: new Date().toISOString() });
  safeSet(DRIVERS_KEY, list);
}

export function toggleDriver(id: string) {
  requireAdmin();
  safeSet(DRIVERS_KEY, getDrivers().map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
}

export function deleteDriver(id: string) {
  requireAdmin();
  safeSet(DRIVERS_KEY, getDrivers().filter((d) => d.id !== id));
}

export function driverById(id: string) {
  return getDrivers().find((d) => d.id === id) ?? null;
}

// ----- Rotas -----
export function getRoutes(): CCRoute[] {
  return safeGet<CCRoute[]>(ROUTES_KEY, []);
}

function randomPoint(seed: number) {
  const r = (n: number) => (Math.sin(seed * 9301 + n * 49297) * 43758.5453) % 1;
  return {
    lat: MAPUTO_BOUNDS.minLat + Math.abs(r(1)) * (MAPUTO_BOUNDS.maxLat - MAPUTO_BOUNDS.minLat),
    lng: MAPUTO_BOUNDS.minLng + Math.abs(r(2)) * (MAPUTO_BOUNDS.maxLng - MAPUTO_BOUNDS.minLng),
  };
}

export function createRoute(input: {
  name: string;
  zone: string;
  date: string;
  driverId: string;
  schedules: CCSchedule[];
}) {
  requireAdmin();
  const list = getRoutes();
  const code = `RT-${String(list.length + 1).padStart(3, "0")}`;
  const stops: CCStop[] = input.schedules.map((s, i) => ({
    id: crypto.randomUUID(),
    client: s.userName || s.userEmail || "Cliente",
    address: s.location,
    scheduleId: s.id,
    done: false,
    ...randomPoint(i + 1 + list.length * 7),
  }));
  list.unshift({
    id: crypto.randomUUID(),
    code,
    name: input.name,
    zone: input.zone,
    date: input.date,
    driverId: input.driverId,
    status: "Planeada",
    stops,
    position: { ...DEPOT },
    createdAt: new Date().toISOString(),
  });
  safeSet(ROUTES_KEY, list);
}

function update(id: string, fn: (r: CCRoute) => CCRoute) {
  safeSet(ROUTES_KEY, getRoutes().map((r) => (r.id === id ? fn(r) : r)));
}

export function startRoute(id: string) {
  requireAdmin();
  update(id, (r) => ({ ...r, status: "Em curso", startedAt: new Date().toISOString() }));
}

export function finishRoute(id: string) {
  requireAdmin();
  update(id, (r) => ({
    ...r,
    status: "Concluída",
    finishedAt: new Date().toISOString(),
    stops: r.stops.map((s) => ({ ...s, done: true })),
    position: { ...DEPOT },
  }));
}

export function completeStop(routeId: string, stopId: string) {
  requireAdmin();
  update(routeId, (r) => {
    const stops = r.stops.map((s) => (s.id === stopId ? { ...s, done: true } : s));
    const stop = stops.find((s) => s.id === stopId);
    return {
      ...r,
      stops,
      position: stop ? { lat: stop.lat, lng: stop.lng } : r.position,
      status: stops.every((s) => s.done) ? "Concluída" : r.status,
    };
  });
}

export function deleteRoute(id: string) {
  requireAdmin();
  safeSet(ROUTES_KEY, getRoutes().filter((r) => r.id !== id));
}

/** Avança a posição das viaturas em curso na direção da próxima paragem. */
export function tickTracking() {
  const routes = getRoutes();
  let changed = false;
  const next = routes.map((r) => {
    if (r.status !== "Em curso") return r;
    const target = r.stops.find((s) => !s.done);
    if (!target) return r;
    const dLat = target.lat - r.position.lat;
    const dLng = target.lng - r.position.lng;
    const dist = Math.hypot(dLat, dLng);
    changed = true;
    if (dist < 0.0009) {
      const stops = r.stops.map((s) => (s.id === target.id ? { ...s, done: true } : s));
      return {
        ...r,
        stops,
        position: { lat: target.lat, lng: target.lng },
        status: (stops.every((s) => s.done) ? "Concluída" : r.status) as CCRouteStatus,
      };
    }
    const step = 0.12;
    return { ...r, position: { lat: r.position.lat + dLat * step, lng: r.position.lng + dLng * step } };
  });
  if (changed) safeSet(ROUTES_KEY, next);
}

export function useLiveTracking(enabled: boolean, intervalMs = 2500) {
  useEffect(() => {
    if (!enabled) return;
    const t = window.setInterval(() => tickTracking(), intervalMs);
    return () => window.clearInterval(t);
  }, [enabled, intervalMs]);
}

export function routeProgress(r: CCRoute) {
  if (!r.stops.length) return 0;
  return Math.round((r.stops.filter((s) => s.done).length / r.stops.length) * 100);
}

/** Rotas visíveis para um cliente (que contenham paragens das suas recolhas). */
export function getRoutesForSchedules(scheduleIds: string[]): CCRoute[] {
  return getRoutes().filter((r) => r.stops.some((s) => s.scheduleId && scheduleIds.includes(s.scheduleId)));
}

export function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setN((n) => n + 1), ms);
    return () => window.clearInterval(t);
  }, [ms]);
}
