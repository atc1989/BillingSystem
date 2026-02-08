let activePrintElement: HTMLElement | null = null;
let prevTransform = "";
let prevTransformOrigin = "";
let restorePrintOnlyDisplay: (() => void) | null = null;

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

export function applyPrintFit() {
  const target = document.querySelector(".print-only [data-print-fit]") as HTMLElement | null;
  if (!target) return;

  console.log("[printFit] target found:", Boolean(target));

  const printOnlyParent = target.closest(".print-only") as HTMLElement | null;
  if (printOnlyParent) {
    const currentDisplay = window.getComputedStyle(printOnlyParent).display;
    if (currentDisplay === "none") {
      const previousInline = printOnlyParent.style.display;
      printOnlyParent.style.display = "block";
      restorePrintOnlyDisplay = () => {
        printOnlyParent.style.display = previousInline;
      };
    } else {
      restorePrintOnlyDisplay = null;
    }
  } else {
    restorePrintOnlyDisplay = null;
  }

  activePrintElement = target;
  prevTransform = target.style.transform;
  prevTransformOrigin = target.style.transformOrigin;

  target.style.transform = "none";
  target.style.transformOrigin = "top left";

  target.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const contentWidth = rect.width;
  const contentHeight = rect.height;
  console.log("[printFit] measured:", { contentWidth, contentHeight });
  if (contentWidth <= 0 || contentHeight <= 0) {
    console.log("[printFit] skip scale due to non-positive size");
    if (restorePrintOnlyDisplay) {
      restorePrintOnlyDisplay();
      restorePrintOnlyDisplay = null;
    }
    return;
  }

  const a4WidthPx = mmToPx(210);
  const a4HeightPx = mmToPx(297);
  const marginPx = mmToPx(8);
  const availableWidth = a4WidthPx - marginPx * 2;
  const availableHeight = a4HeightPx - marginPx * 2;

  const widthScale = availableWidth / contentWidth;
  const heightScale = availableHeight / contentHeight;
  let scale = Math.min(widthScale, heightScale);
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;
  if (scale < 1) scale = 1;
  if (scale > 1) scale = Math.min(scale, 1.35);
  console.log("[printFit] scale:", scale);

  target.style.transformOrigin = "top left";
  target.style.transform = `scale(${scale})`;
}

export function resetPrintFit() {
  if (!activePrintElement) return;
  activePrintElement.style.transform = prevTransform || "";
  activePrintElement.style.transformOrigin = prevTransformOrigin || "";
  activePrintElement = null;
  if (restorePrintOnlyDisplay) {
    restorePrintOnlyDisplay();
    restorePrintOnlyDisplay = null;
  }
}

export function registerPrintFitListeners() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeprint", applyPrintFit);
  window.addEventListener("afterprint", resetPrintFit);
}
