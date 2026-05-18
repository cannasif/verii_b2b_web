import type {
  Html5Qrcode as Html5QrcodeClass,
  Html5QrcodeCameraScanConfig,
} from 'html5-qrcode';

export type Html5QrcodeInstance = Html5QrcodeClass;
export type Html5QrcodeModule = typeof import('html5-qrcode');

let html5QrcodeModulePromise: Promise<Html5QrcodeModule> | null = null;

export async function loadHtml5Qrcode(): Promise<Html5QrcodeModule> {
  html5QrcodeModulePromise ??= import('html5-qrcode');
  return html5QrcodeModulePromise;
}

export function createDefaultScannerConfig(
  module: Html5QrcodeModule,
): Html5QrcodeCameraScanConfig {
  const { Html5QrcodeScanType, Html5QrcodeSupportedFormats } = module;

  return {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.ITF,
    ],
  } as Html5QrcodeCameraScanConfig;
}

export async function getPreferredCameraId(
  Html5Qrcode: Html5QrcodeModule['Html5Qrcode'],
): Promise<string | { facingMode: string }> {
  const devices = await Html5Qrcode.getCameras();
  const backCamera = devices.find(
    (device) =>
      device.label.toLowerCase().includes('back') ||
      device.label.toLowerCase().includes('rear') ||
      device.label.toLowerCase().includes('environment'),
  );

  return backCamera ? backCamera.id : { facingMode: 'environment' };
}

export async function stopAndClearScanner(
  scanner: Html5QrcodeInstance | null,
): Promise<void> {
  if (!scanner) {
    return;
  }

  try {
    await scanner.stop();
  } catch {
    // Ignore stop errors when dialog closes before the camera is fully initialized.
  }

  scanner.clear();
}
