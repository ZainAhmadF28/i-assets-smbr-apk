import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Asset } from "@/types";

export async function printQrPdf(asset: Asset): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [70, 70],
  });

  const qrDataUrl = await QRCode.toDataURL(asset.id, {
    width: 512,
    margin: 0,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 70, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const title = (asset.namaAset || "ASET").toUpperCase();
  doc.text(title.slice(0, 30), 35, 11, { align: "center" });

  doc.addImage(qrDataUrl, "PNG", 17.5, 14, 35, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(asset.nomorAset || asset.id.slice(0, 12), 35, 53, {
    align: "center",
  });

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 66, 70, 4, "F");

  doc.save(`qr_${asset.nomorAset || asset.id}.pdf`);
}
