import { useState } from "react";
import { getSchedules, useStoreData } from "@/lib/cc-auth";
import {
  MAPUTO_BOUNDS,
  addDriver,
  completeStop,
  createRoute,
  deleteDriver,
  deleteRoute,
  finishRoute,
  getDrivers,
  getRoutes,
  routeProgress,
  startRoute,
  toggleDriver,
  useLiveTracking,
  type CCRoute,
} from "@/lib/cc-fleet";

const STATUS_COLOR: Record<CCRoute["status"], string> = {
  Planeada: "bg-[#F5A623]/20 text-[#8a5b00]",
  "Em curso": "bg-green-100 text-green-700",
  Concluída: "bg-[#0A2342]/10 text-[#0A2342]",
};

export function DriversPanel() {
  const drivers = useStoreData(getDrivers);
  const [form, setForm] = useState({
    name: "", phone: "", license: "", vehiclePlate: "", vehicleModel: "", capacity: "3 ton",
  });
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.name || !form.phone || !form.vehiclePlate) throw new Error("Nome, telefone e matrícula são obrigatórios");
      addDriver(form);
      setForm({ name: "", phone: "", license: "", vehiclePlate: "", vehicleModel: "", capacity: "3 ton" });
      setMsg("Motorista registado ✅");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro");
    }
    setTimeout(() => setMsg(null), 2500);
  };

  const field = (k: keyof typeof form, label: string, placeholder = "") => (
    <label className="block">
      <span className="text-sm font-semibold text-[#0A2342]/80">{label}</span>
      <input
        value={form[k]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black mb-4">Cadastrar Motorista &amp; Viatura</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {field("name", "Nome completo", "João Matola")}
          {field("phone", "Telefone", "+258 84 000 0000")}
          {field("license", "Carta de condução", "MZ-123456")}
          {field("vehiclePlate", "Matrícula", "AAA-123-MP")}
          {field("vehicleModel", "Viatura", "Toyota Dyna")}
          {field("capacity", "Capacidade", "3 ton")}
          <div className="md:col-span-3 flex items-center gap-4">
            <button className="bg-[#0D5E3E] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-90">
              Registar motorista
            </button>
            {msg && <span className="text-sm font-semibold text-[#0A2342]/70">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black mb-4">Motoristas ({drivers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#0A2342]/60 border-b">
                <th className="py-2 pr-3">Motorista</th>
                <th className="py-2 pr-3">Contacto</th>
                <th className="py-2 pr-3">Viatura</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-3 pr-3">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-[#0A2342]/50">{d.license || "—"}</div>
                  </td>
                  <td className="py-3 pr-3">{d.phone}</td>
                  <td className="py-3 pr-3">
                    <div className="font-mono font-bold">{d.vehiclePlate}</div>
                    <div className="text-xs text-[#0A2342]/50">{d.vehicleModel} · {d.capacity}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <button
                      onClick={() => toggleDriver(d.id)}
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        d.active ? "bg-green-100 text-green-700" : "bg-[#0A2342]/10 text-[#0A2342]/60"
                      }`}
                    >
                      {d.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <button
                      onClick={() => { if (confirm(`Remover ${d.name}?`)) deleteDriver(d.id); }}
                      className="text-red-600 text-xs font-bold hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-[#0A2342]/50">Nenhum motorista registado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function RoutesPanel() {
  const drivers = useStoreData(getDrivers);
  const routes = useStoreData(getRoutes);
  const schedules = useStoreData(getSchedules);
  const pending = schedules.filter((s) => s.status === "Pendente");
  const active = routes.filter((r) => r.status === "Em curso");
  useLiveTracking(active.length > 0);

  const [form, setForm] = useState({ name: "", zone: "Maputo — Baixa", date: new Date().toISOString().slice(0, 10), driverId: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const current = routes.find((r) => r.id === (selected ?? routes[0]?.id)) ?? null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.name || !form.driverId) throw new Error("Nome da rota e motorista são obrigatórios");
      if (picked.length === 0) throw new Error("Seleccione pelo menos uma recolha");
      createRoute({ ...form, schedules: pending.filter((s) => picked.includes(s.id)) });
      setPicked([]);
      setForm({ ...form, name: "" });
      setMsg("Rota criada ✅");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro");
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black mb-4">Criar Rota de Recolha</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#0A2342]/80">Nome da rota</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rota Manhã — Polana"
                className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#0A2342]/80">Zona</span>
              <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-[#0A2342]/80">Data</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2" />
            </label>
            <label className="block md:col-span-3">
              <span className="text-sm font-semibold text-[#0A2342]/80">Motorista / viatura</span>
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2 bg-white">
                <option value="">— escolher —</option>
                {drivers.filter((d) => d.active).map((d) => (
                  <option key={d.id} value={d.id}>{d.name} · {d.vehiclePlate}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0A2342]/80 mb-2">Recolhas pendentes ({pending.length})</p>
            <div className="max-h-52 overflow-y-auto border border-[#0A2342]/10 rounded-xl divide-y">
              {pending.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-[#F5F7FA]">
                  <input
                    type="checkbox"
                    checked={picked.includes(s.id)}
                    onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))}
                  />
                  <span className="font-semibold">{s.userName ?? "Cliente"}</span>
                  <span className="text-[#0A2342]/60">{s.location}</span>
                  <span className="ml-auto text-xs text-[#0A2342]/50">{s.date} {s.time}</span>
                </label>
              ))}
              {pending.length === 0 && (
                <p className="px-3 py-4 text-sm text-[#0A2342]/50">Sem recolhas pendentes para atribuir.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-[#0D5E3E] text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-90">Criar rota</button>
            {msg && <span className="text-sm font-semibold text-[#0A2342]/70">{msg}</span>}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-black mb-4">Rotas ({routes.length})</h2>
          <div className="space-y-3">
            {routes.map((r) => {
              const d = drivers.find((x) => x.id === r.driverId);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`w-full text-left border rounded-xl p-4 transition ${
                    current?.id === r.id ? "border-[#0D5E3E] bg-[#0D5E3E]/5" : "border-[#0A2342]/10 hover:bg-[#F5F7FA]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">{r.code} · {r.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-[#0A2342]/60 mt-1">
                    {r.zone} · {r.date} · {d ? `${d.name} (${d.vehiclePlate})` : "sem motorista"}
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-[#0A2342]/10 overflow-hidden">
                    <div className="h-full bg-[#0D5E3E] transition-all" style={{ width: `${routeProgress(r)}%` }} />
                  </div>
                  <p className="text-xs text-[#0A2342]/50 mt-1">
                    {r.stops.filter((s) => s.done).length}/{r.stops.length} paragens · {routeProgress(r)}%
                  </p>
                </button>
              );
            })}
            {routes.length === 0 && <p className="text-sm text-[#0A2342]/50">Nenhuma rota criada.</p>}
          </div>
        </div>

        <div className="space-y-6">
          {current ? (
            <>
              <TrackingMap route={current} />
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {current.status === "Planeada" && (
                    <button onClick={() => startRoute(current.id)} className="bg-[#0D5E3E] text-white text-sm font-bold px-4 py-2 rounded-xl">
                      Iniciar rota
                    </button>
                  )}
                  {current.status === "Em curso" && (
                    <button onClick={() => finishRoute(current.id)} className="bg-[#0A2342] text-white text-sm font-bold px-4 py-2 rounded-xl">
                      Concluir rota
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm("Eliminar rota?")) { deleteRoute(current.id); setSelected(null); } }}
                    className="text-red-600 text-sm font-bold hover:underline ml-auto"
                  >
                    Eliminar
                  </button>
                </div>
                <ol className="space-y-2">
                  {current.stops.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 text-sm border border-[#0A2342]/10 rounded-xl px-3 py-2">
                      <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${
                        s.done ? "bg-[#0D5E3E] text-white" : "bg-[#0A2342]/10"
                      }`}>{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{s.client}</p>
                        <p className="text-xs text-[#0A2342]/60 truncate">{s.address}</p>
                      </div>
                      {!s.done && (
                        <button onClick={() => completeStop(current.id, s.id)} className="ml-auto text-xs font-bold text-[#0D5E3E] hover:underline">
                          Marcar recolhida
                        </button>
                      )}
                      {s.done && <span className="ml-auto text-xs font-bold text-[#0D5E3E]">✓ recolhida</span>}
                    </li>
                  ))}
                  {current.stops.length === 0 && <p className="text-sm text-[#0A2342]/50">Rota sem paragens.</p>}
                </ol>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-sm text-[#0A2342]/50">
              Seleccione uma rota para ver o rastreamento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrackingMap({ route }: { route: CCRoute }) {
  const { minLat, maxLat, minLng, maxLng } = MAPUTO_BOUNDS;
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * 100;
  const path = route.stops.map((s) => `${x(s.lng)},${y(s.lat)}`).join(" ");

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black">Rastreamento — {route.code}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[route.status]}`}>{route.status}</span>
      </div>
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#EAF3EE] border border-[#0A2342]/10">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i} stroke="#0A2342" strokeOpacity="0.06" strokeWidth="0.3">
              <line x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
              <line x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
            </g>
          ))}
          {route.stops.length > 1 && (
            <polyline points={path} fill="none" stroke="#0D5E3E" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="2 1.5" />
          )}
        </svg>
        {route.stops.map((s, i) => (
          <div
            key={s.id}
            title={`${s.client} — ${s.address}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-[10px] font-black shadow ${
              s.done ? "bg-[#0D5E3E] text-white" : "bg-white text-[#0A2342] border border-[#0A2342]/20"
            }`}
            style={{ left: `${x(s.lng)}%`, top: `${y(s.lat)}%` }}
          >
            {i + 1}
          </div>
        ))}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xl transition-all duration-1000 ease-linear drop-shadow"
          style={{ left: `${x(route.position.lng)}%`, top: `${y(route.position.lat)}%` }}
          title="Viatura"
        >
          🚛
        </div>
      </div>
      <p className="text-xs text-[#0A2342]/50 mt-2">
        Posição actualizada a cada 2,5 s enquanto a rota estiver em curso · área operacional Maputo.
      </p>
    </div>
  );
}
