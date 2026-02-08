let activePrintElement: HTMLElement | null = null;
let prevTransform = "";
let prevTransformOrigin = "";

function mmToPx(mm: number): number {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.width = "100mm";
  document.body.appendChild(probe);
  const pxPerMm = probe.getBoundingClientRect().width / 100;
  document.body.removeChild(probe);
  return mm * pxPerMm;
}

function isVisible(el: Element): el is HTMLElement {
  const node = el as HTMLElement;
  if (!node) return false;
  if (node.offsetParent !== null) return true;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function applyPrintFit() {
  const candidates = Array.from(document.querySelectorAll("[data-print-fit]"));
  const target = candidates.find(isVisible);
  if (!target) return;

  activePrintElement = target;
  prevTransform = target.style.transform;
  prevTransformOrigin = target.style.transformOrigin;

  target.style.transform = "none";
  target.style.transformOrigin = "top center";

  const rect = target.getBoundingClientRect();
  const contentWidth = rect.width;
  const contentHeight = rect.height;
  if (!contentWidth || !contentHeight) return;

  const a4WidthPx = mmToPx(210);
  const a4HeightPx = mmToPx(297);
  const marginPx = mmToPx(8);
  const availableWidth = a4WidthPx - marginPx * 2;
  const availableHeight = a4HeightPx - marginPx * 2;

  const widthScale = availableWidth / contentWidth;
  const heightScale = availableHeight / contentHeight;
  let scale = Math.min(widthScale, heightScale);
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;
  if (scale > 1) scale = Math.min(scale, 1.35);

  target.style.transformOrigin = "top center";
  target.style.transform = `scale(${scale})`;
}

export function resetPrintFit() {
  if (!activePrintElement) return;
  activePrintElement.style.transform = prevTransform || "";
  activePrintElement.style.transformOrigin = prevTransformOrigin || "";
  activePrintElement = null;
}

export function registerPrintFitListeners() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeprint", applyPrintFit);
  window.addEventListener("afterprint", resetPrintFit);
}
