type PrintDocumentOptions = {
  title: string;
  contentHtml: string;
  pageCss?: string;
  extraCss?: string;
};

type PrintElementOptions = PrintDocumentOptions & {
  elementId: string;
};

const collectStyles = (): string =>
  Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n");

const waitForStyles = async (printDocument: Document): Promise<void> => {
  const stylesheetLinks = Array.from(
    printDocument.querySelectorAll('link[rel="stylesheet"]')
  ) as HTMLLinkElement[];

  await Promise.all(
    stylesheetLinks.map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link.sheet) {
            resolve();
            return;
          }

          const finish = () => resolve();
          link.addEventListener("load", finish, { once: true });
          link.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 2000);
        })
    )
  );
};

const waitForFonts = async (printDocument: Document): Promise<void> => {
  if (!("fonts" in printDocument)) return;

  try {
    await printDocument.fonts.ready;
  } catch {
    // Ignore font readiness failures and continue printing.
  }
};

const waitForLayout = async (printWindow: Window): Promise<void> =>
  new Promise((resolve) => {
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(() => resolve());
    });
  });

export async function printHtmlDocument({
  title,
  contentHtml,
  pageCss = "@page { size: A4 portrait; margin: 10mm; }",
  extraCss = ""
}: PrintDocumentOptions): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const printWindow = iframe.contentWindow;
  const printDocument = printWindow?.document;

  if (!printWindow || !printDocument) {
    cleanup();
    throw new Error("Unable to create the print document.");
  }

  printWindow.onafterprint = () => {
    window.setTimeout(cleanup, 150);
  };

  printDocument.open();
  printDocument.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    ${collectStyles()}
    <style>
      ${pageCss}
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        background: #ffffff;
        color: #111827;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: Inter, Arial, sans-serif;
      }
      body {
        min-height: 100%;
      }
      .print-document {
        width: 100%;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .print-document .no-print {
        display: none !important;
      }
      .print-document .overflow-x-auto,
      .print-document .overflow-auto {
        overflow: visible !important;
      }
      .print-document table {
        page-break-inside: auto;
      }
      .print-document tr,
      .print-document td,
      .print-document th {
        page-break-inside: avoid;
      }
      ${extraCss}
    </style>
  </head>
  <body>
    <div class="print-document">${contentHtml}</div>
  </body>
</html>`);
  printDocument.close();

  await waitForStyles(printDocument);
  await waitForFonts(printDocument);
  await waitForLayout(printWindow);

  printWindow.focus();
  printWindow.print();

  window.setTimeout(cleanup, 1500);
}

export async function printElementById({
  elementId,
  title,
  pageCss,
  extraCss
}: PrintElementOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Print target "${elementId}" was not found.`);
  }

  await printHtmlDocument({
    title,
    contentHtml: element.outerHTML,
    pageCss,
    extraCss
  });
}
