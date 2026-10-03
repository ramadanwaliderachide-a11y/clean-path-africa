import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — CleanConnect" },
      { name: "description", content: "Aceda à sua conta CleanConnect para agendar recolhas e ver o seu Score Verde." },
      { property: "og:title", content: "Entrar — CleanConnect" },
      { property: "og:description", content: "Aceda à sua conta CleanConnect." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email || !form.password) throw new Error("Preencha email e palavra-passe");
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw new Error(error.message.includes("confirmed") ? "Confirme o seu email primeiro." : "Credenciais inválidas");
        navigate({ to: "/dashboard" });
      } else {
        if (!form.name.trim()) throw new Error("Nome é obrigatório");
        if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("Email inválido");
        if (form.password.length < 6) throw new Error("A palavra-passe deve ter pelo menos 6 caracteres");
        if (form.password !== form.confirm) throw new Error("As palavras-passe não coincidem");
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: form.name.trim(), phone: form.phone },
          },
        });
        if (error) throw new Error(error.message);
        if (data.session) navigate({ to: "/dashboard" });
        else {
          setInfo("Conta criada! Verifique o seu email e clique no link de confirmação.");
          setMode("login");
        }
      }
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
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                mode === m ? "bg-white shadow text-[#0D5E3E]" : "text-[#0A2342]/60"
              }`}
            >
              {m === "login" ? "Entrar" : "Registar"}
            </button>
          ))}
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
          {info && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D5E3E] text-white font-bold py-3 rounded-xl hover:bg-[#1A8B5C] transition disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center mt-6">
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
