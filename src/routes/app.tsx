import { createFileRoute } from "@tanstack/react-router";
import AppPage from "@/components/cleanconnect/AppPage";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "CleanConnect App — Serviços, Planos e Contacto" },
      { name: "description", content: "Explore os serviços, planos e equipa da CleanConnect — a plataforma de gestão ambiental para PME em Moçambique." },
      { property: "og:title", content: "CleanConnect App" },
      { property: "og:description", content: "Recolha on-demand, marketplace de recicláveis e Score Verde para PME." },
    ],
  }),
  component: AppPage,
});