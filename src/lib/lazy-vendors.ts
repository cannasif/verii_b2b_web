let jsPdfPromise: Promise<typeof import('jspdf')> | null = null;
let bwipLinearPromise: Promise<typeof import('bwip-js/browser')> | null = null;

export async function loadJsPdfModule(): Promise<typeof import('jspdf')> {
  jsPdfPromise ??= import('jspdf');
  return jsPdfPromise;
}

export async function loadBwipLinearModule(): Promise<typeof import('bwip-js/browser')> {
  bwipLinearPromise ??= import('bwip-js/browser');
  return bwipLinearPromise;
}
