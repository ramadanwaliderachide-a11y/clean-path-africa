import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, logout } from "@/lib/cc-auth";
import { supabase } from "@/integrations/supabase/client";
import LeafletMap, { type MapMarker } from "@/components/cleanconnect/LeafletMap";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — CleanConnect" },
      { name: "description", content: "Gerir motoristas, rotas e recolhas no mapa." },
      { property: "og:title", content: "Painel Admin — CleanConnect" },
      { property: "og:description", content: "Gestão de motoristas, rotas e recolhas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Driver = { id: string; name: string; phone: string | null; vehicle: string | null; active: boolean };
type RouteRow = { id: string; name: string; driver_id: string | null; route_date: string; status: string };
type Pickup = {
  id: string; waste_type: string; qty: string; pickup_date: string; pickup_time: string; location: string;
  status: string; lat: number | null; lng: number | null; route_id: string | null;
};

const STATUS_COLOR: Record<string, string> = { Pendente: "#F5A623", Concluído: "#1A8B5C", Cancelado: "#DC2626" };

function Admin() {
  const user = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"map" | "drivers" | "routes">("map");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const [d, r, p] = await Promise.all([
      supabase.from("drivers").select("*").order("created_at", { ascending: false }),
      supabase.from("routes").select("*").order("route_date", { ascending: false }),
      supabase.from("pickups").select("*").order("pickup_date", { ascending: false }),
    ]);
    setErr(d.error?.message ?? r.error?.message ?? p.error?.message ?? null);
    setDrivers((d.data as Driver[]) ?? []);
    setRoutes((r.data as RouteRow[]) ?? []);
    setPickups((p.data as Pickup[]) ?? []);
  };

  useEffect(() => {
    if (user === null) navigate({ to: "/login" });
    if (user?.isAdmin) load();
  }, [user, navigate]);

  if (!user) return <Center>A carregar...</Center>;
  if (!user.isAdmin)
    return (
      <Center>
        <p>Esta área é só para administradores.</p>
        <Link to="/dashboard" className="text-[#0D5E3E] font-semibold underline mt-2 block">Ir para o Dashboard</Link>
      </Center>
    );

  return (
    <div className="cc-root min-h-screen bg-[#F9FAFB] text-[#0A2342]">
      <header className="bg-[#0A2342] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="font-black text-lg">CleanConnect <span className="text-[#F5A623]">Admin</span></Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="hover:text-[#F5A623]">Dashboard</Link>
            <button onClick={async () => { await logout(); navigate({ to: "/login" }); }} className="hover:text-[#F5A623]">Sair</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Motoristas" value={drivers.length} />
          <Stat label="Rotas" value={routes.length} />
          <Stat label="Recolhas pendentes" value={pickups.filter((p) => p.status === "Pendente").length} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {([["map", "🗺️ Recolhas no mapa"], ["drivers", "🧑‍✈️ Motoristas"], ["routes", "🛣️ Rotas"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl font-semibold ${tab === id ? "bg-[#0D5E3E] text-white" : "bg-white shadow-sm"}`}>
              {l}
            </button>
          ))}
        </div>

        {err && <p className="text-sm text-red-700 bg-red-50 p-2 rounded-lg">{err}</p>}

        {tab === "map" && <PickupsMap pickups={pickups} routes={routes} onChange={load} />}
        {tab === "drivers" && <Drivers drivers={drivers} onChange={load} />}
        {tab === "routes" && <Routes routes={routes} drivers={drivers} pickups={pickups} onChange={load} />}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="cc-root min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] text-[#0A2342]">{children}</div>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-[#0A2342]/60">{label}</p>
      <p className="text-2xl font-black text-[#0D5E3E]">{value}</p>
    </div>
  );
}
const input = "border border-[#0A2342]/15 rounded-xl px-3 py-2 outline-none focus:border-[#0D5E3E] bg-white";
const btn = "bg-[#F5A623] text-[#0A2342] font-bold px-4 py-2 rounded-xl hover:scale-105 transition";

function PickupsMap({ pickups, routes, onChange }: { pickups: Pickup[]; routes: RouteRow[]; onChange: () => void }) {
  const markers: MapMarker[] = pickups
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id, lat: p.lat!, lng: p.lng!, color: STATUS_COLOR[p.status],
      label: `<b>${p.waste_type}</b> · ${p.qty}<br/>${p.pickup_date} ${p.pickup_time}<br/>${p.location}<br/>${p.status}`,
    }));
  const update = async (id: string, patch: Partial<Pickup>) => {
    await supabase.from("pickups").update(patch).eq("id", id);
    onChange();
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <LeafletMap height={460} markers={markers} />
        <div className="flex gap-4 text-xs mt-2">
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: c }} />{s}</span>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[#0A2342]/60 border-b">
            <th className="py-2 pr-3">Data</th><th className="pr-3">Tipo</th><th className="pr-3">Local</th><th className="pr-3">Rota</th><th className="pr-3">Status</th>
          </tr></thead>
          <tbody>
            {pickups.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-3">{p.pickup_date} {p.pickup_time}</td>
                <td className="pr-3">{p.waste_type} · {p.qty}</td>
                <td className="pr-3">{p.location}</td>
                <td className="pr-3">
                  <select className={input} value={p.route_id ?? ""} onChange={(e) => update(p.id, { route_id: e.target.value || null })}>
                    <option value="">—</option>
                    {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="pr-3">
                  <select className={input} value={p.status} onChange={(e) => update(p.id, { status: e.target.value })}>
                    {Object.keys(STATUS_COLOR).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {pickups.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-[#0A2342]/50">Ainda não há recolhas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Drivers({ drivers, onChange }: { drivers: Driver[]; onChange: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", vehicle: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setMsg("Nome é obrigatório");
    const { error } = await supabase.from("drivers").insert({ name: f.name.trim(), phone: f.phone || null, vehicle: f.vehicle || null });
    if (error) return setMsg(error.message);
    setF({ name: "", phone: "", vehicle: "" }); setMsg(null); onChange();
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-black">Criar motorista</h2>
      <form onSubmit={add} className="grid md:grid-cols-4 gap-3">
        <input className={input} placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={input} placeholder="Telefone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className={input} placeholder="Viatura / matrícula" value={f.vehicle} onChange={(e) => setF({ ...f, vehicle: e.target.value })} />
        <button className={btn}>Adicionar</button>
      </form>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <ul className="divide-y">
        {drivers.map((d) => (
          <li key={d.id} className="py-3 flex items-center justify-between gap-3">
            <div><p className="font-bold">{d.name}</p><p className="text-xs text-[#0A2342]/60">{d.phone ?? "—"} · {d.vehicle ?? "—"}</p></div>
            <div className="flex gap-2">
              <button onClick={async () => { await supabase.from("drivers").update({ active: !d.active }).eq("id", d.id); onChange(); }}
                className={`text-xs font-bold px-2 py-1 rounded-full ${d.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                {d.active ? "Ativo" : "Inativo"}
              </button>
              <button onClick={async () => { if (confirm("Remover motorista?")) { await supabase.from("drivers").delete().eq("id", d.id); onChange(); } }}
                className="text-xs text-red-600 font-semibold">Remover</button>
            </div>
          </li>
        ))}
        {drivers.length === 0 && <li className="py-4 text-sm text-[#0A2342]/50">Sem motoristas.</li>}
      </ul>
    </div>
  );
}

function Routes({ routes, drivers, pickups, onChange }: { routes: RouteRow[]; drivers: Driver[]; pickups: Pickup[]; onChange: () => void }) {
  const [f, setF] = useState({ name: "", driver_id: "", route_date: new Date().toISOString().slice(0, 10) });
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setMsg("Nome da rota é obrigatório");
    const { error } = await supabase.from("routes").insert({ name: f.name.trim(), driver_id: f.driver_id || null, route_date: f.route_date });
    if (error) return setMsg(error.message);
    setF({ ...f, name: "" }); setMsg(null); onChange();
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-black">Criar rota</h2>
      <form onSubmit={add} className="grid md:grid-cols-4 gap-3">
        <input className={input} placeholder="Nome (ex.: Polana manhã)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select className={input} value={f.driver_id} onChange={(e) => setF({ ...f, driver_id: e.target.value })}>
          <option value="">Sem motorista</option>
          {drivers.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input type="date" className={input} value={f.route_date} onChange={(e) => setF({ ...f, route_date: e.target.value })} />
        <button className={btn}>Criar</button>
      </form>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      <ul className="divide-y">
        {routes.map((r) => {
          const stops = pickups.filter((p) => p.route_id === r.id);
          const driver = drivers.find((d) => d.id === r.driver_id);
          return (
            <li key={r.id} className="py-3 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-xs text-[#0A2342]/60">{r.route_date} · {driver?.name ?? "Sem motorista"} · {stops.length} paragens</p>
                </div>
                <div className="flex gap-2 items-center">
                  <select className={input + " text-xs"} value={r.status}
                    onChange={async (e) => { await supabase.from("routes").update({ status: e.target.value }).eq("id", r.id); onChange(); }}>
                    {["Planeada", "Em curso", "Concluída"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-xs font-semibold text-[#0D5E3E] underline">
                    {open === r.id ? "Fechar mapa" : "Ver no mapa"}
                  </button>
                  <button onClick={async () => { if (confirm("Apagar rota?")) { await supabase.from("routes").delete().eq("id", r.id); onChange(); } }}
                    className="text-xs text-red-600 font-semibold">Apagar</button>
                </div>
              </div>
              {open === r.id && (
                <LeafletMap height={300} markers={stops.filter((p) => p.lat != null).map((p) => ({
                  id: p.id, lat: p.lat!, lng: p.lng!, color: STATUS_COLOR[p.status], label: `${p.waste_type} · ${p.location}`,
                }))} />
              )}
            </li>
          );
        })}
        {routes.length === 0 && <li className="py-4 text-sm text-[#0A2342]/50">Sem rotas. Associe recolhas a rotas no separador do mapa.</li>}
      </ul>
    </div>
  );
}
