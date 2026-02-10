export function printReceipt(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const runPrint = () => {
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      cleanup();
      return;
    }

    printWindow.focus();
    printWindow.print();

    setTimeout(cleanup, 800);
  };

  const printDocument = iframe.contentWindow?.document;
  if (!printDocument) {
    cleanup();
    return;
  }

  printDocument.open();
  printDocument.write(html);
  printDocument.close();

  iframe.onload = () => {
    setTimeout(runPrint, 0);
  };

  setTimeout(runPrint, 100);
}
