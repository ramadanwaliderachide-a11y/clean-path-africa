import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { team, services, roadmap, CONTACT_EMAIL } from "@/data/cleanconnect";

const SLIDES = 11;

export default function PitchDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActive(idx);
      setShowTop(idx >= 2);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  };

  return (
    <div className="cc-root relative">
      <div ref={containerRef} className="cc-snap">
        <Slide1 onNext={() => goTo(1)} />
        <Slide2 />
        <Slide3 />
        <Slide4 />
        <Slide5 />
        <Slide6 />
        <Slide7 />
        <Slide8 />
        <Slide9 />
        <Slide10 />
        <Slide11 />
      </div>

      {/* Dots */}
      <div className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 md:gap-3">
        {Array.from({ length: SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all ${
              active === i
                ? "bg-[#F5A623] w-3 h-3 md:w-4 md:h-4"
                : "bg-white/50 hover:bg-white w-2 h-2 md:w-2.5 md:h-2.5"
            }`}
          />
        ))}
      </div>

      {showTop && (
        <button
          onClick={() => goTo(0)}
          className="fixed bottom-6 right-6 z-50 bg-[#F5A623] text-[#0A2342] rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-110 transition font-bold"
          aria-label="Voltar ao topo"
        >
          ↑
        </button>
      )}
    </div>
  );
}

function Slide1({ onNext }: { onNext: () => void }) {
  return (
    <section className="cc-slide cc-gradient text-white">
      <div className="max-w-4xl text-center cc-fade-in-up">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">CleanConnect</h1>
        <p className="mt-6 text-lg md:text-2xl text-white/90">
          Transformar Moçambique num país mais limpo, um telemóvel de cada vez
        </p>
        <p className="mt-4 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
          Conectar empresas moçambicanas a soluções de gestão ambiental simples, digitais e acessíveis.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNext}
            className="bg-[#F5A623] text-[#0A2342] font-bold px-8 py-4 rounded-2xl hover:scale-105 transition shadow-lg"
          >
            Conhecer a Solução
          </button>
          <Link
            to="/app"
            className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-[#0A2342] transition"
          >
            Aceder ao App
          </Link>
        </div>
      </div>
    </section>
  );
}

function Slide2() {
  const items = [
    { icon: "🗑️", text: "17.000 toneladas/dia de resíduos sem gestão adequada" },
    { icon: "🏚️", text: "70% da população sem saneamento básico" },
    { icon: "⚠️", text: "Lixões a céu aberto em todas as províncias" },
    { icon: "📱", text: "50.000+ PME sem solução digital ambiental" },
  ];
  return (
    <section className="cc-slide bg-white text-[#0A2342]">
      <div className="max-w-6xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">A Crise Ambiental em Moçambique</h2>
        <p className="mt-4 text-center text-[#0A2342]/70 md:text-lg">Um problema nacional que precisa de uma solução digital</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, i) => (
            <div key={i} className="bg-[#F5F7FA] rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="text-5xl">{it.icon}</div>
              <p className="mt-4 font-semibold">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Slide3() {
  return (
    <section className="cc-slide cc-gradient text-white">
      <div className="max-w-6xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">CleanConnect — A Plataforma</h2>
        <p className="mt-4 text-center text-white/80 md:text-lg">
          Três pilares para transformar a gestão ambiental em Moçambique
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div key={i} className="cc-glass rounded-2xl p-8">
              <div className="text-5xl">{s.icon}</div>
              <h3 className="mt-4 text-2xl font-bold">{s.title}</h3>
              <p className="mt-3 text-white/80">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Slide4() {
  const steps = [
    "Pede recolha via App ou USSD (*123#)",
    "Motorista recolhe no horário escolhido",
    "Pagas com M-Pesa ou E-Mola",
    "O teu Score Verde é atualizado",
  ];
  return (
    <section className="cc-slide bg-white text-[#0A2342]">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center cc-fade-in-up">
        <div>
          <h2 className="text-3xl md:text-5xl font-black">Como Funciona</h2>
          <p className="mt-4 text-[#0A2342]/70 md:text-lg">Simples, rápido e 100% digital.</p>
          <ol className="mt-8 space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5A623] text-[#0A2342] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-1.5 font-medium">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex justify-center">
          <div className="w-64 h-[500px] bg-[#0A2342] rounded-[2.5rem] p-3 shadow-2xl">
            <div className="w-full h-full bg-white rounded-[2rem] p-5 flex flex-col">
              <div className="text-center font-bold text-[#0D5E3E]">CleanConnect</div>
              <div className="mt-6 bg-[#1A8B5C]/10 rounded-xl p-4">
                <p className="text-sm font-semibold">Recolha agendada ✅</p>
                <p className="text-xs text-[#0A2342]/70 mt-1">Hoje • 14:30</p>
              </div>
              <div className="mt-3 bg-[#F5A623]/15 rounded-xl p-4">
                <p className="text-xs">Valor</p>
                <p className="text-xl font-bold">150 MZN</p>
              </div>
              <button className="mt-auto bg-[#0D5E3E] text-white py-3 rounded-xl font-bold">
                Pagar com M-Pesa
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slide5() {
  const cards = [
    { v: "250.000", l: "PME registadas em Moçambique" },
    { v: "50.000", l: "PME endereçáveis a curto prazo" },
    { v: "11", l: "Províncias + Cidade de Maputo" },
  ];
  return (
    <section className="cc-slide cc-gradient text-white">
      <div className="max-w-6xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">Oportunidade Nacional</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="cc-glass rounded-2xl p-8 text-center">
              <div className="text-4xl md:text-5xl font-black text-[#F5A623]">{c.v}</div>
              <p className="mt-3 text-white/85">{c.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-white/60">
          Concorrência fragmentada e informal — espaço para o primeiro player digital nacional.
        </p>
      </div>
    </section>
  );
}

function Slide6() {
  const rev = [
    { p: "60%", l: "Subscrições" },
    { p: "25%", l: "Marketplace" },
    { p: "15%", l: "Certificados" },
  ];
  const proj = [
    { y: "Ano 1", v: "5M MZN", l: "500 PME" },
    { y: "Ano 2", v: "20M MZN", l: "2.000 PME" },
    { y: "Ano 3", v: "60M MZN", l: "5.000 PME" },
  ];
  return (
    <section className="cc-slide bg-white text-[#0A2342]">
      <div className="max-w-6xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">Modelo de Negócio</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {rev.map((r, i) => (
            <div key={i} className="bg-[#F5F7FA] rounded-2xl p-8 text-center">
              <div className="text-5xl font-black text-[#0D5E3E]">{r.p}</div>
              <p className="mt-2 font-semibold">{r.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {proj.map((p, i) => (
            <div key={i} className="cc-gradient text-white rounded-2xl p-6 text-center">
              <div className="text-sm text-white/70">{p.y}</div>
              <div className="text-2xl md:text-3xl font-black mt-1">{p.v}</div>
              <div className="text-xs text-white/80 mt-1">{p.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Slide7() {
  return (
    <section className="cc-slide cc-gradient text-white">
      <div className="max-w-5xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">Roadmap de Expansão</h2>
        <div className="mt-12 relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#F5A623]/40" />
          <div className="space-y-8">
            {roadmap.map((r, i) => {
              const left = i % 2 === 0;
              return (
                <div key={i} className={`md:flex ${left ? "md:justify-start" : "md:justify-end"}`}>
                  <div className={`cc-glass rounded-2xl p-6 md:w-5/12 ${left ? "" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-[#F5A623]">{r.year}</span>
                      {r.badge && (
                        <span className="text-xs font-bold bg-[#F5A623] text-[#0A2342] px-3 py-1 rounded-full">
                          {r.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-white/90">{r.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Slide8() {
  const m = [
    { v: "10.000+", l: "Toneladas de resíduos geridos/ano" },
    { v: "5.000+", l: "PME conectadas" },
    { v: "500+", l: "Empregos diretos e indiretos" },
  ];
  return (
    <section className="cc-slide bg-white text-[#0A2342]">
      <div className="max-w-6xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">Impacto Esperado</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {m.map((x, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl md:text-7xl font-black text-[#0D5E3E]">{x.v}</div>
              <p className="mt-3 text-[#0A2342]/80 font-medium">{x.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Slide9() {
  const alloc = [
    { p: "40%", l: "Desenvolvimento" },
    { p: "30%", l: "Operações" },
    { p: "20%", l: "Marketing" },
    { p: "10%", l: "Legal" },
  ];
  return (
    <section className="cc-slide cc-gradient text-white">
      <div className="max-w-5xl w-full cc-fade-in-up text-center">
        <h2 className="text-3xl md:text-5xl font-black">Ronda de Investimento</h2>
        <div className="mt-8 inline-block cc-glass rounded-2xl px-10 py-6">
          <div className="text-4xl md:text-6xl font-black text-[#F5A623]">250.000 MZN</div>
          <div className="text-white/80 mt-1">~ 3.850 USD</div>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {alloc.map((a, i) => (
            <div key={i} className="cc-glass rounded-2xl p-5">
              <div className="text-3xl font-black text-[#F5A623]">{a.p}</div>
              <p className="mt-1 text-sm text-white/85">{a.l}</p>
            </div>
          ))}
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Quero Investir na CleanConnect`}
          className="mt-10 inline-block bg-[#F5A623] text-[#0A2342] font-bold px-8 py-4 rounded-2xl hover:scale-105 transition shadow-lg"
        >
          Quero Investir
        </a>
      </div>
    </section>
  );
}

function Slide10() {
  return (
    <section className="cc-slide bg-white text-[#0A2342]">
      <div className="max-w-6xl w-full cc-fade-in-up">
        <h2 className="text-3xl md:text-5xl font-black text-center">A Equipa</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((m, i) => (
            <div key={i} className="text-center">
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
  );
}

function Slide11() {
  return (
    <section className="cc-slide cc-gradient text-white">
      <div className="max-w-4xl w-full text-center cc-fade-in-up">
        <h2 className="text-4xl md:text-6xl font-black">Vamos Transformar Moçambique</h2>
        <p className="mt-6 text-white/85 md:text-lg">
          Junte-se a nós para construir a maior plataforma de gestão ambiental de África.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-6 inline-block text-[#F5A623] font-semibold underline"
        >
          {CONTACT_EMAIL}
        </a>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agendar Reunião — CleanConnect`}
            className="bg-[#F5A623] text-[#0A2342] font-bold px-8 py-4 rounded-2xl hover:scale-105 transition shadow-lg"
          >
            Agendar Reunião
          </a>
          <Link
            to="/app"
            className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-[#0A2342] transition"
          >
            Explorar a Plataforma
          </Link>
        </div>
        <p className="mt-12 text-white/60 text-sm">
          Transformar Moçambique num país mais limpo, um telemóvel de cada vez · © 2026 CleanConnect
        </p>
      </div>
    </section>
  );
}