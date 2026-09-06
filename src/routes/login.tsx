import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login, register } from "@/lib/cc-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — CleanConnect" },
      { name: "description", content: "Aceda à sua conta CleanConnect para agendar recolhas e ver o seu Score Verde." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email || !form.password) throw new Error("Preencha email e palavra-passe");
        login(form.email.trim(), form.password);
      } else {
        if (!form.name.trim()) throw new Error("Nome é obrigatório");
        if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("Email inválido");
        if (form.password.length < 6) throw new Error("A palavra-passe deve ter pelo menos 6 caracteres");
        if (form.password !== form.confirm) throw new Error("As palavras-passe não coincidem");
        register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
      }
      navigate({ to: "/dashboard" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-root min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 text-[#0A2342]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 cc-fade-in-up">
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-black text-[#0D5E3E]">CleanConnect</Link>
          <p className="text-sm text-[#0A2342]/60">Gestão Ambiental — Moçambique</p>
        </div>

        <div className="flex bg-[#F5F7FA] rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              mode === "login" ? "bg-white shadow text-[#0D5E3E]" : "text-[#0A2342]/60"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              mode === "register" ? "bg-white shadow text-[#0D5E3E]" : "text-[#0A2342]/60"
            }`}
          >
            Registar
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <Field label="Nome completo" value={form.name} onChange={onChange("name")} />
              <Field label="Telefone" value={form.phone} onChange={onChange("phone")} type="tel" placeholder="+258 ..." />
            </>
          )}
          <Field label="Email" value={form.email} onChange={onChange("email")} type="email" />
          <Field label="Palavra-passe" value={form.password} onChange={onChange("password")} type="password" />
          {mode === "register" && (
            <Field label="Confirmar palavra-passe" value={form.confirm} onChange={onChange("confirm")} type="password" />
          )}

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D5E3E] text-white font-bold py-3 rounded-xl hover:bg-[#1A8B5C] transition disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-xs text-[#0A2342]/50 mt-6">
          Os dados são guardados localmente no seu dispositivo (demo).
        </p>
        <p className="text-center mt-4">
          <Link to="/app" className="text-sm text-[#0D5E3E] font-semibold hover:underline">
            ← Voltar à plataforma
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#0A2342]/80">{props.label}</span>
      <input
        value={props.value}
        onChange={props.onChange}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        className="mt-1 w-full border border-[#0A2342]/15 rounded-xl px-3 py-2 outline-none focus:border-[#0D5E3E]"
      />
    </label>
  );
}