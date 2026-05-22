import { createFileRoute } from "@tanstack/react-router";
import PitchDeck from "@/components/cleanconnect/PitchDeck";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CleanConnect — Gestão Ambiental em Moçambique" },
      { name: "description", content: "Transformar Moçambique num país mais limpo, um telemóvel de cada vez. Recolha on-demand, marketplace de recicláveis e Score Verde." },
      { property: "og:title", content: "CleanConnect — Gestão Ambiental em Moçambique" },
      { property: "og:description", content: "Plataforma mobile-first de gestão ambiental para PME em Moçambique." },
    ],
  }),
  component: Index,
});

function Index() {
  return <PitchDeck />;
}
