import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useUser,
  logout,
  getSchedules,
  getCertificates,
  getAllUsers,
  updateScheduleStatus,
  deleteSchedule,
  issueCertificate,
  deleteCertificate,
  deleteUser,
  useStoreData,
  isAdmin,
  type CCSchedule,
} from "@/lib/cc-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — CleanConnect" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "users" | "schedules" | "certs";

function AdminPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (!isAdmin(user)) {
      navigate({ to: "/dashboard" });
    } else {
      setReady(true);
    }
  }, [user, navigate]);

  if (!ready || !user) {
    return (
      <div className="cc-root min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-[#0A2342]/60">A carregar...</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Visão Geral", icon: "📊" },
    { id: "users", label: "Utilizadores", icon: "👥" },
    { id: "schedules", label: "Recolhas", icon: "🚛" },
    { id: "certs", label: "Certificados", icon: "📜" },
  ];

  return (
    <div className="cc-root min-h-screen bg-[#F9FAFB] text-[#0A2342]">
      <header className="bg-[#0A2342] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-black text-lg text-white">CleanConnect</Link>
            <span className="bg-[#F5A623] text-[#0A2342] text-[10px] font-black px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm font-semibold text-white/80 hover:text-[#F5A623] hidden sm:inline">
              Meu Dashboard
            </Link>
            <span className="hidden sm:inline text-sm">{user.name}</span>
            <button
              onClick={() => { logout(); navigate({ to: "/login" }); }}
              className="text-sm font-semibold text-white/80 hover:text-[#F5A623]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside>
          <nav className="bg-white rounded-2xl p-2 shadow-sm flex md:flex-col overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 md:w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition ${
                  tab === t.id ? "bg-[#0A2342] text-white" : "hover:bg-[#F5F7FA] text-[#0A2342]"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="cc-fade-in-up space-y-6">
          {tab === "overview" && <AdminOverview />}
          {tab === "users" && <UsersPanel />}
          {tab === "schedules" && <SchedulesPanel />}
          {tab === "certs" && <CertsPanel />}
        </main>
      </div>
    </div>
  );
}

function AdminOverview() {
  const users = useStoreData(getAllUsers);
  const schedules = useStoreData(getSchedules);
  const certs = useStoreData(getCertificates);
  const pending = schedules.filter((s) => s.status === "Pendente").length;
  const done = schedules.filter((s) => s.status === "Concluído").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-black">Painel de Administração</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Utilizadores" value={users.length} icon="👥" color="#0D5E3E" />
        <Kpi label="Recolhas" value={schedules.length} icon="🚛" color="#1A8B5C" />
        <Kpi label="Pendentes" value={pending} icon="⏳" color="#F5A623" />
        <Kpi label="Concluídas" value={done} icon="✅" color="#0A2342" />
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-black text-lg mb-3">Certificados emitidos</h2>
        <p className="text-3xl font-black text-[#F5A623]">{certs.length}</p>
        <p className="text-sm text-[#0A2342]/60">Total de certificados verdes na plataforma.</p>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#0A2342]/60">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-black mt-2" style={{ color }}>{value}</p>
    </div>
  );
}

function UsersPanel() {
  const users = useStoreData(getAllUsers);
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-black mb-4">Utilizadores ({users.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0A2342]/60 border-b">
              <th className="py-2 pr-3">Nome</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Telefone</th>
              <th className="py-2 pr-3">Papel</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-b last:border-0">
                <td className="py-3 pr-3 font-semibold">{u.name}</td>
                <td className="py-3 pr-3">{u.email}</td>
                <td className="py-3 pr-3">{u.phone || "—"}</td>
                <td className="py-3 pr-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    u.role === "admin" ? "bg-[#F5A623]/20 text-[#F5A623]" : "bg-green-100 text-green-700"
                  }`}>
                    {u.role ?? "user"}
                  </span>
                </td>
                <td className="py-3 pr-3 text-right">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${u.email}?`)) deleteUser(u.email);
                      }}
                      className="text-red-600 text-xs font-bold hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-[#0A2342]/50">Sem utilizadores.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SchedulesPanel() {
  const schedules = useStoreData(getSchedules);
  const [filter, setFilter] = useState<"Todos" | CCSchedule["status"]>("Todos");
  const list = filter === "Todos" ? schedules : schedules.filter((s) => s.status === filter);

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-black">Todas as Recolhas ({schedules.length})</h2>
        <div className="flex gap-1 bg-[#F5F7FA] p-1 rounded-xl">
          {(["Todos", "Pendente", "Concluído", "Cancelado"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                filter === f ? "bg-white shadow text-[#0D5E3E]" : "text-[#0A2342]/60"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0A2342]/60 border-b">
              <th className="py-2 pr-3">Cliente</th>
              <th className="py-2 pr-3">Data</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Local</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-3 pr-3">
                  <div className="font-semibold">{s.userName ?? "—"}</div>
                  <div className="text-xs text-[#0A2342]/50">{s.userEmail ?? ""}</div>
                </td>
                <td className="py-3 pr-3">{s.date} {s.time && `· ${s.time}`}</td>
                <td className="py-3 pr-3">{s.type}</td>
                <td className="py-3 pr-3">{s.location}</td>
                <td className="py-3 pr-3">
                  <select
                    value={s.status}
                    onChange={(e) => updateScheduleStatus(s.id, e.target.value as CCSchedule["status"])}
                    className="text-xs font-bold border border-[#0A2342]/15 rounded-lg px-2 py-1 bg-white"
                  >
                    <option>Pendente</option>
                    <option>Concluído</option>
                    <option>Cancelado</option>
                  </select>
                </td>
                <td className="py-3 pr-3 text-right">
                  <button
                    onClick={() => { if (confirm("Eliminar recolha?")) deleteSchedule(s.id); }}
                    className="text-red-600 text-xs font-bold hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-[#0A2342]/50">Sem recolhas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CertsPanel() {
  const users = useStoreData(getAllUsers);
  const certs = useStoreData(getCertificates);
  const clients = users.filter((u) => u.role !== "admin");
  const [form, setForm] = useState({
    userEmail: "",
    month: new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
    score: 80,
    level: "Prata" as "Bronze" | "Prata" | "Ouro",
  });
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = clients.find((u) => u.email === form.userEmail);
    if (!target) {
      setMsg("Seleccione um utilizador.");
      return;
    }
    issueCertificate({
      month: form.month,
      score: Number(form.score),
      level: form.level,
      userEmail: target.email,
      userName: target.name,
    });
    setMsg(`Certificado emitido para ${target.name} ✅`);
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black mb-4">Emitir Certificado</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-[#0A2342]/80">Utilizador</span>
            <select
              value={form.userEmail}
              onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
              className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2 bg-white"
            >
              <option value="">— escolher —</option>
              {clients.map((u) => (
                <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#0A2342]/80">Mês / Período</span>
            <input
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#0A2342]/80">Score (0-100)</span>
            <input
              type="number" min={0} max={100}
              value={form.score}
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#0A2342]/80">Nível</span>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as "Bronze" | "Prata" | "Ouro" })}
              className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2 bg-white"
            >
              <option>Bronze</option>
              <option>Prata</option>
              <option>Ouro</option>
            </select>
          </label>
          <div className="md:col-span-2">
            {msg && (
              <p className={`text-sm rounded-lg p-2 mb-3 ${msg.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {msg}
              </p>
            )}
            <button className="bg-[#F5A623] text-[#0A2342] font-bold px-6 py-3 rounded-xl hover:scale-105 transition">
              Emitir Certificado
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black mb-4">Certificados Emitidos ({certs.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((c) => (
            <div key={c.id} className="border border-[#0A2342]/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">📜</span>
                <span className={`text-xs font-black px-2 py-1 rounded-full ${
                  c.level === "Ouro" ? "bg-[#F5A623]/20 text-[#F5A623]" :
                  c.level === "Prata" ? "bg-gray-200 text-gray-700" :
                  "bg-orange-100 text-orange-700"
                }`}>{c.level}</span>
              </div>
              <h3 className="mt-3 font-bold">{c.userName ?? "—"}</h3>
              <p className="text-xs text-[#0A2342]/50">{c.userEmail ?? ""}</p>
              <p className="text-sm mt-2">{c.month} · Score {c.score}</p>
              <button
                onClick={() => { if (confirm("Eliminar certificado?")) deleteCertificate(c.id); }}
                className="mt-3 text-red-600 text-xs font-bold hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}
          {certs.length === 0 && (
            <p className="text-[#0A2342]/50 text-sm">Ainda não foram emitidos certificados.</p>
          )}
        </div>
      </div>
    </div>
  );
}