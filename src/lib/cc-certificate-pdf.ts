import jsPDF from "jspdf";
import type { CCCertificate, CCUser } from "./cc-auth";

export function downloadCertificatePdf(cert: CCCertificate, user: CCUser) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, w, h, "F");

  // Outer border (gold)
  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(6);
  doc.rect(24, 24, w - 48, h - 48);

  // Inner border (green)
  doc.setDrawColor(13, 94, 62);
  doc.setLineWidth(1.5);
  doc.rect(36, 36, w - 72, h - 72);

  // Header band
  doc.setFillColor(13, 94, 62);
  doc.rect(36, 36, w - 72, 70, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CleanConnect", w / 2, 70, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Gestão Ambiental e Saneamento — Moçambique", w / 2, 90, { align: "center" });

  // Title
  doc.setTextColor(10, 35, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text("Certificado Verde", w / 2, 170, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("Este certificado é atribuído a", w / 2, 205, { align: "center" });

  // User name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(13, 94, 62);
  doc.text(user.name, w / 2, 245, { align: "center" });

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  const body =
    `pelo seu compromisso com a gestão sustentável de resíduos no mês de ${cert.month},\n` +
    `alcançando um Score Verde de ${cert.score}/100 — nível ${cert.level}.`;
  doc.text(body, w / 2, 285, { align: "center" });

  // Score badge
  const cx = w / 2;
  const cy = 380;
  doc.setFillColor(245, 166, 35);
  doc.circle(cx, cy, 55, "F");
  doc.setTextColor(10, 35, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(String(cert.score), cx, cy + 4, { align: "center" });
  doc.setFontSize(10);
  doc.text("/ 100", cx, cy + 22, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(13, 94, 62);
  doc.text(`Nível ${cert.level}`, cx, cy + 80, { align: "center" });

  // Footer signatures
  const fy = h - 90;
  doc.setDrawColor(180, 180, 180);
  doc.line(90, fy, 270, fy);
  doc.line(w - 270, fy, w - 90, fy);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Direção CleanConnect", 180, fy + 16, { align: "center" });
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-PT")}`, w - 180, fy + 16, { align: "center" });

  // Certificate id
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`ID: ${cert.id.toUpperCase()}  •  ${user.email}`, w / 2, h - 50, { align: "center" });

  const safeMonth = cert.month.replace(/\s+/g, "_");
  doc.save(`CleanConnect_Certificado_${safeMonth}.pdf`);
}