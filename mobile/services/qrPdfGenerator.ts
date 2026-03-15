import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Image, Platform, Alert } from "react-native";
import { API_BASE_URL } from "@config/apiConfig";

// ── Types ────────────────────────────────────────────────────────────────────
interface QrPdfData {
  id: string;
  namaAset: string;
  nomorAset: string;
  kelasAsetSig: string | null;
  kelasAsetSmbr: string | null;
  site: string | null;
  kondisi: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert the bundled icon.png to a base64 data URI */
async function getLogoBase64(): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const assetSource = Image.resolveAssetSource(require("../assets/icon.png"));
    let uriToRead = assetSource.uri;

    // If it's a remote URL (e.g. from Metro dev server), we must download it first
    if (uriToRead.startsWith("http")) {
      const tempUri = `${FileSystem.cacheDirectory}temp_logo.png`;
      await FileSystem.downloadAsync(uriToRead, tempUri);
      uriToRead = tempUri;
    }

    const base64 = await FileSystem.readAsStringAsync(uriToRead, {
      encoding: "base64",
    });

    // Cleanup temp file if we created one
    if (uriToRead.startsWith(FileSystem.cacheDirectory || "")) {
      await FileSystem.deleteAsync(uriToRead, { idempotent: true });
    }

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.warn("Failed to load logo for PDF", error);
    return "";
  }
}

/** Fetch the QR code image from the backend as base64 data URI */
async function getQrBase64(assetId: string): Promise<string> {
  try {
    const url = `${API_BASE_URL}/api/assets/${assetId}/qrcode`;
    const fileUri = `${FileSystem.cacheDirectory}qr_${assetId}.png`;

    await FileSystem.downloadAsync(url, fileUri);

    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64",
    });

    // Clean up temp file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.warn("Failed to load QR code for PDF", error);
    return "";
  }
}

/** Map kondisi enum to a human-friendly label */
function kondisiLabel(kondisi: string): string {
  const map: Record<string, string> = {
    BAIK: "Baik",
    RUSAK: "Rusak",
    RUSAK_BERAT: "Rusak Berat",
    HILANG: "Hilang",
    BELUM_DICEK: "Belum Dicek",
  };
  return map[kondisi] || kondisi;
}

/** Map kondisi to a badge color */
function kondisiColor(kondisi: string): string {
  const map: Record<string, string> = {
    BAIK: "#16a34a",
    RUSAK: "#f59e0b",
    RUSAK_BERAT: "#ef4444",
    HILANG: "#6b7280",
    BELUM_DICEK: "#3b82f6",
  };
  return map[kondisi] || "#6b7280";
}

// ── HTML Template ────────────────────────────────────────────────────────────

// ── HTML Template ────────────────────────────────────────────────────────────

function buildHtml(data: QrPdfData, logoBase64: string, qrBase64: string): string {
  // We use a 1:1 square layout based on the user's reference image
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page {
      margin: 0;
      size: auto;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      color: #000; /* Pure black for thermal printing */
      background: #fff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100vw;
      height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    /* Top Left Logo */
    .logo-container {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 50px; /* Adjust based on original image logo size */
    }
    .logo-container img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    /* Content Area */
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding: 0 10px;
      margin-top: 25px; /* give some room from the top */
    }

    .asset-name {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 8px;
    }

    .qr-container {
      width: 130px;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .qr-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .asset-id {
      font-size: 14px;
      font-weight: normal;
      text-align: center;
    }

    /* Bottom Black Bar */
    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 8px;
      background-color: #000;
    }
  </style>
</head>
<body>
  <!-- Top Left Logo -->
  ${logoBase64 ? `
  <div class="logo-container">
    <img src="${logoBase64}" alt="Logo" />
  </div>
  ` : ""}

  <div class="content">
    <div class="asset-name">${data.namaAset}</div>
    
    <div class="qr-container">
      ${qrBase64 ? `<img src="${qrBase64}" alt="QR" />` : `<p>No QR</p>`}
    </div>

    <div class="asset-id">${data.nomorAset ? data.nomorAset : data.id.split('-')[0]}</div>
  </div>

  <!-- Bottom Bar -->
  <div class="bottom-bar"></div>
</body>
</html>
  `.trim();
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function printQrPdf(asset: QrPdfData): Promise<void> {
  try {
    // Fetch logo & QR in parallel
    const [logoBase64, qrBase64] = await Promise.all([
      getLogoBase64(),
      getQrBase64(asset.id),
    ]);

    const html = buildHtml(asset, logoBase64, qrBase64);

    // Set 1:1 dimensions. 200x200 points is around 70x70mm.
    const PDF_SIZE = 200;

    if (Platform.OS === "ios") {
      await Print.printAsync({ 
        html,
        width: PDF_SIZE,
        height: PDF_SIZE
      });
    } else {
      const { uri } = await Print.printToFileAsync({ 
        html,
        width: PDF_SIZE,
        height: PDF_SIZE
      });
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Sticker QR - ${asset.namaAset}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Info", `PDF disimpan di: ${uri}`);
      }
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    Alert.alert("Error", "Gagal membuat PDF Sticker. Silakan coba lagi.");
  }
}
