import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { team, services, plans, CONTACT_EMAIL } from "@/data/cleanconnect";

export default function AppPage() {
  const [open, setOpen] = useState(false);
  const nav = [
    { href: "#servicos", label: "Serviços" },
    { href: "#planos", label: "Planos" },
    { href: "#equipa", label: "Equipa" },
    { href: "#contacto", label: "Contacto" },
  ];

  return (
    <div className="cc-root bg-white text-[#0A2342]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#0A2342]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="font-black text-xl text-[#0D5E3E]">CleanConnect</div>
            <div className="text-xs text-[#0A2342]/60">Gestão Ambiental — Moçambique</div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="font-medium hover:text-[#1A8B5C] transition">
                {n.label}
              </a>
            ))}
            <Link
              to="/"
              className="bg-[#0D5E3E] text-white font-semibold px-4 py-2 rounded-xl hover:bg-[#1A8B5C] transition"
            >
              Pitch Deck
            </Link>
          </nav>
          <button
            className="md:hidden text-2xl"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-[#0A2342]/10 px-4 py-4 flex flex-col gap-3">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="font-medium">
                {n.label}
              </a>
            ))}
            <Link to="/" className="bg-[#0D5E3E] text-white font-semibold px-4 py-2 rounded-xl text-center">
              Pitch Deck
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="cc-gradient text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-32 text-center cc-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-black">Bem-vindo à CleanConnect</h1>
          <p className="mt-6 text-white/85 md:text-lg max-w-2xl mx-auto">
            A plataforma digital que liga PME moçambicanas a recolha de resíduos,
            reciclagem e certificação ambiental — direto do telemóvel.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#planos" className="bg-[#F5A623] text-[#0A2342] font-bold px-8 py-4 rounded-2xl hover:scale-105 transition">
              Ver Planos
            </a>
            <a href="#servicos" className="border-2 border-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-[#0A2342] transition">
              Conhecer Serviços
            </a>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center">Os Nossos Serviços</h2>
          <p className="mt-4 text-center text-[#0A2342]/70">Três pilares para a sua gestão ambiental.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-[#F5F7FA] rounded-2xl p-8 hover:shadow-lg transition">
                <div className="text-5xl">{s.icon}</div>
                <h3 className="mt-4 text-2xl font-bold">{s.title}</h3>
                <p className="mt-3 text-[#0A2342]/75">{s.desc}</p>
                <ul className="mt-5 space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-[#1A8B5C] font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 px-4 md:px-8 bg-[#F5F7FA]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center">Planos & Preços</h2>
          <p className="mt-4 text-center text-[#0A2342]/70">Escolha o plano ideal para o seu negócio.</p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition ${
                  p.popular ? "ring-2 ring-[#F5A623] md:scale-105" : ""
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F5A623] text-[#0A2342] text-xs font-black px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                )}
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-black text-[#0D5E3E]">{p.price}</span>
                  <span className="text-[#0A2342]/70"> MZN/mês</span>
                </div>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-[#1A8B5C] font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Subscrição — Plano ${p.name}`}
                  className={`mt-8 block text-center font-bold py-3 rounded-xl transition ${
                    p.popular
                      ? "bg-[#F5A623] text-[#0A2342] hover:scale-105"
                      : "bg-[#0D5E3E] text-white hover:bg-[#1A8B5C]"
                  }`}
                >
                  Escolher {p.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipa */}
      <section id="equipa" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center">A Nossa Equipa</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((m) => (
              <div key={m.initials} className="text-center">
                <div
                  className="mx-auto w-28 h-28 rounded-full flex items-center justify-center text-white text-2xl font-black border-4 border-[#F5A623]"
                  style={{ background: "linear-gradient(135deg, #0D5E3E, #0A2342)" }}
                >
                  {m.initials}
                </div>
                <h3 className="mt-4 text-xl font-bold">{m.name}</h3>
                <p className="text-[#1A8B5C] font-semibold">{m.role}</p>
                <p className="mt-2 text-sm text-[#0A2342]/70">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contacto" className="cc-gradient text-white py-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black">
            Pronto para Transformar a sua Gestão Ambiental?
          </h2>
          <p className="mt-4 text-white/85">A nossa equipa está pronta para o ajudar a começar.</p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Quero falar com a equipa CleanConnect`}
            className="mt-8 inline-block bg-[#F5A623] text-[#0A2342] font-bold px-8 py-4 rounded-2xl hover:scale-105 transition shadow-lg"
          >
            Falar com a Equipa
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A2342] text-white/80 py-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="font-black text-xl text-white">CleanConnect</div>
          <p className="mt-2 text-sm">Transformar Moçambique num país mais limpo, um telemóvel de cada vez</p>
          <p className="mt-3 text-xs text-white/60">© 2026 CleanConnect. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}