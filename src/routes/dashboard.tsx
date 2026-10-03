import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, logout, useUser } from "@/lib/cc-auth";
import { supabase } from "@/integrations/supabase/client";
import LeafletMap from "@/components/cleanconnect/LeafletMap";

type Pickup = {
  id: string; waste_type: string; qty: string; pickup_date: string; pickup_time: string;
  location: string; status: string; value: string; lat: number | null; lng: number | null;
};

function usePickups() {
  const [list, setList] = useState<Pickup[]>([]);
  const load = () =>
    supabase.from("pickups").select("*").order("pickup_date", { ascending: false })
      .then(({ data }) => setList((data as Pickup[]) ?? []));
  useEffect(() => { load(); }, []);
  return { list, reload: load };
}

function certsFrom(pickups: Pickup[]) {
  const done = pickups.filter((p) => p.status === "Concluído");
  const byMonth = new Map<string, number>();
  done.forEach((p) => {
    const k = p.pickup_date.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  });
  return [...byMonth.entries()].map(([m, n]) => {
    const score = Math.min(100, 50 + n * 10);
    return { id: m, month: m, score, level: score >= 85 ? "Ouro" : score >= 70 ? "Prata" : "Bronze" };
  });
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CleanConnect" },
      { name: "description", content: "Acompanhe o seu Score Verde, agende recolhas e descarregue certificados." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type Tab = "overview" | "schedule" | "history" | "certs" | "settings";

function Dashboard() {
  const user = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (user === null) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="cc-root min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-[#0A2342]/60">A carregar...</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "schedule", label: "Agendar Recolha", icon: "🚛" },
    { id: "history", label: "Histórico", icon: "🗂️" },
    { id: "certs", label: "Certificados", icon: "📜" },
    { id: "settings", label: "Definições", icon: "⚙️" },
  ];

  return (
    <div className="cc-root min-h-screen bg-[#F9FAFB] text-[#0A2342]">
      <header className="bg-white border-b border-[#0A2342]/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-2xl" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
              ☰
            </button>
            <Link to="/" className="font-black text-lg text-[#0D5E3E]">CleanConnect</Link>
          </div>
          <div className="flex items-center gap-3">
            {user.isAdmin && (
              <Link to="/admin" className="text-sm font-bold bg-[#F5A623] text-[#0A2342] px-3 py-1.5 rounded-lg">
                Painel Admin
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D5E3E] to-[#0A2342] text-white text-sm font-black flex items-center justify-center border-2 border-[#F5A623]">
                {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <span className="text-sm font-semibold">{user.name}</span>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate({ to: "/login" });
              }}
              className="text-sm font-semibold text-[#0A2342]/70 hover:text-[#0D5E3E]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className={`${navOpen ? "block" : "hidden"} md:block`}>
          <nav className="bg-white rounded-2xl p-2 shadow-sm">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setNavOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition ${
                  tab === t.id ? "bg-[#0D5E3E] text-white" : "hover:bg-[#F5F7FA] text-[#0A2342]"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="cc-fade-in-up">
          {tab === "overview" && <Overview />}
          {tab === "schedule" && <ScheduleForm onDone={() => setTab("history")} />}
          {tab === "history" && <History />}
          {tab === "certs" && <Certs />}
          {tab === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}

function Overview() {
  const { list: schedules } = usePickups();
  const certs = certsFrom(schedules);
  const done = schedules.filter((s) => s.status === "Concluído").length;
  const score = Math.min(100, 40 + done * 8);
  const next = schedules.find((s) => s.status === "Pendente");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-black">Bem-vindo de volta 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <ScoreRing value={score} />
          <div>
            <p className="text-sm text-[#0A2342]/60">Score Verde</p>
            <p className="text-2xl font-black text-[#0D5E3E]">{score}/100</p>
            <p className="text-xs text-[#1A8B5C] font-semibold">Nível {score >= 85 ? "Ouro" : score >= 70 ? "Prata" : "Bronze"}</p>
          </div>
        </div>

        <StatCard label="Próxima Recolha" value={next ? next.pickup_date : "—"} sub={next?.pickup_time ?? ""} icon="🚛" />
        <StatCard label="Total de Recolhas" value={String(schedules.length)} sub="este ano" icon="♻️" />
        <StatCard label="Certificados" value={String(certs.length)} sub="emitidos" icon="📜" />
      </div>

      <div className="bg-gradient-to-br from-[#0D5E3E] to-[#0A2342] text-white rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-black">Continue a melhorar o seu Score Verde</h2>
        <p className="mt-2 text-white/85 text-sm">
          Agende recolhas regulares e separe recicláveis para subir para o nível Ouro.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#0A2342]/60">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-black mt-2">{value}</p>
      <p className="text-xs text-[#0A2342]/50">{sub}</p>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} stroke="#E5E7EB" strokeWidth="6" fill="none" />
      <circle
        cx="32"
        cy="32"
        r={r}
        stroke="#0D5E3E"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function ScheduleForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({
    type: "Resíduos sólidos",
    qty: "",
    date: "",
    time: "",
    location: "",
    notes: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const user = useUser();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.qty || !f.date || !f.time || !f.location) {
      setMsg("Preencha quantidade, data, hora e localização.");
      return;
    }
    if (!pos) {
      setMsg("Marque o local da recolha no mapa.");
      return;
    }
    if (!user) return;
    const { error } = await supabase.from("pickups").insert({
      user_id: user.id, waste_type: f.type, qty: f.qty, pickup_date: f.date, pickup_time: f.time,
      location: f.location, notes: f.notes || null, lat: pos.lat, lng: pos.lng,
    });
    if (error) { setMsg("Erro: " + error.message); return; }
    setMsg("Recolha agendada! ✅");
    setTimeout(onDone, 800);
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h1 className="text-2xl font-black">Agendar Recolha</h1>
      <p className="text-[#0A2342]/60 text-sm mt-1">Preencha os dados para a próxima recolha.</p>

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de resíduo"
          value={f.type}
          onChange={(v) => setF({ ...f, type: v })}
          options={["Resíduos sólidos", "Recicláveis", "Orgânicos", "Eletrónicos", "Perigosos"]}
        />
        <Input label="Quantidade estimada" placeholder="ex.: 50 kg" value={f.qty} onChange={(v) => setF({ ...f, qty: v })} />
        <Input label="Data" type="date" value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        <Input label="Hora" type="time" value={f.time} onChange={(v) => setF({ ...f, time: v })} />
        <Input label="Localização" placeholder="ex.: Maputo, Polana" value={f.location} onChange={(v) => setF({ ...f, location: v })} />
        <Input label="Observações" placeholder="opcional" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} />

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#0A2342]/80">Local no mapa (toque para marcar)</span>
            <button
              type="button"
              onClick={() => navigator.geolocation?.getCurrentPosition((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }))}
              className="text-xs font-semibold text-[#0D5E3E] underline"
            >
              Usar a minha localização
            </button>
          </div>
          <LeafletMap height={280} picked={pos} onPick={(lat, lng) => setPos({ lat, lng })} />
        </div>

        <div className="md:col-span-2">
          {msg && (
            <p className={`text-sm rounded-lg p-2 mb-3 ${msg.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {msg}
            </p>
          )}
          <button className="bg-[#F5A623] text-[#0A2342] font-bold px-6 py-3 rounded-xl hover:scale-105 transition">
            Agendar
          </button>
        </div>
      </form>
    </div>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#0A2342]/80">{props.label}</span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2 outline-none focus:border-[#0D5E3E]"
      />
    </label>
  );
}
function Select(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#0A2342]/80">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2 outline-none focus:border-[#0D5E3E] bg-white"
      >
        {props.options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function History() {
  const { list: schedules } = usePickups();
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h1 className="text-2xl font-black">Histórico de Recolhas</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0A2342]/60 border-b">
              <th className="py-2 pr-3">Data</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Quantidade</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-3 pr-3">{s.pickup_date} · {s.pickup_time}</td>
                <td className="py-3 pr-3">{s.waste_type}</td>
                <td className="py-3 pr-3">{s.qty}</td>
                <td className="py-3 pr-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                    s.status === "Concluído" ? "bg-green-100 text-green-700" :
                    s.status === "Pendente" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{s.status}</span>
                </td>
                <td className="py-3 pr-3 font-semibold">{s.value}</td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-[#0A2342]/50">Sem recolhas ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Certs() {
  const { list } = usePickups();
  const certs = certsFrom(list);
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h1 className="text-2xl font-black">Certificados</h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certs.length === 0 && <p className="text-sm text-[#0A2342]/50">Os certificados aparecem após recolhas concluídas.</p>}
        {certs.map((c) => (
          <div key={c.id} className="border border-[#0A2342]/10 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-3xl">📜</span>
              <span className={`text-xs font-black px-2 py-1 rounded-full ${
                c.level === "Ouro" ? "bg-[#F5A623]/20 text-[#F5A623]" :
                c.level === "Prata" ? "bg-gray-200 text-gray-700" :
                "bg-orange-100 text-orange-700"
              }`}>{c.level}</span>
            </div>
            <h3 className="mt-3 font-bold">{c.month}</h3>
            <p className="text-sm text-[#0A2342]/60">Score: {c.score}/100</p>
            <button
              onClick={() => alert(`Download do certificado de ${c.month} (simulado)`)}
              className="mt-4 w-full bg-[#0D5E3E] text-white font-semibold py-2 rounded-xl hover:bg-[#1A8B5C] transition"
            >
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  const user = useUser();
  if (!user) return null;
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h1 className="text-2xl font-black">Definições</h1>
      <div className="mt-6 space-y-3 text-sm">
        <Row label="Nome" value={user.name} />
        <Row label="Email" value={user.email} />
        <Row label="Telefone" value={user.phone || "—"} />
      </div>
      <p className="text-xs text-[#0A2342]/50 mt-6">
        Conta guardada de forma segura na nuvem.
      </p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[#0A2342]/10 py-2">
      <span className="text-[#0A2342]/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}