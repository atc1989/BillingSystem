import { formatDate, formatMoneyPHP, labelPaymentMethod } from "./format";

interface ReceiptBreakdown {
  description?: string | null;
  amount: number | string;
  payment_method?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_no?: string | null;
}

interface BuildReceiptHtmlParams {
  reference_no: string;
  request_date: string;
  status?: string | null;
  vendor_name: string;
  requester_name: string;
  breakdowns: ReceiptBreakdown[];
  total_amount: number | string;
  remarks?: string | null;
  company_name?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function labelStatus(status?: string | null): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "awaiting_approval":
      return "Awaiting Approval";
    case "approved":
      return "Approved";
    case "paid":
      return "Paid";
    case "void":
      return "Void";
    default:
      return status || "-";
  }
}

export function buildReceiptHtml(params: BuildReceiptHtmlParams): string {
  const {
    reference_no,
    request_date,
    status,
    vendor_name,
    requester_name,
    breakdowns,
    total_amount,
    remarks,
    company_name = "AccuCount"
  } = params;

  const printedAt = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  const itemsHtml = breakdowns
    .map((item) => {
      const paymentMethod = labelPaymentMethod(item.payment_method);
      const bankInfo =
        item.payment_method === "bank_transfer"
          ? `<div class="bank-info">
              <div><span class="label">Bank:</span> ${escapeHtml(item.bank_name || "-")}</div>
              <div><span class="label">Account:</span> ${escapeHtml(item.bank_account_name || "-")}</div>
              <div><span class="label">No:</span> ${escapeHtml(item.bank_account_no || "-")}</div>
            </div>`
          : "";

      return `<div class="item">
          <div class="item-row">
            <div class="item-meta">
              <div class="description">${escapeHtml(item.description || "-")}</div>
              <div class="method">${escapeHtml(paymentMethod)}</div>
            </div>
            <div class="amount">${escapeHtml(formatMoneyPHP(item.amount))}</div>
          </div>
          ${bankInfo}
        </div>`;
    })
    .join("");

  const remarksHtml = remarks
    ? `<div class="divider"></div>
      <div class="section-title">Remarks</div>
      <div class="remarks">${escapeHtml(remarks)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Payment Request Receipt</title>
  <style>
    :root {
      color-scheme: light;
    }

    @page {
      size: 80mm auto;
      margin: 6mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      width: 68mm;
      font-family: ui-sans-serif, system-ui, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }

    .receipt {
      width: 100%;
    }

    .center {
      text-align: center;
    }

    .company {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.2px;
      margin-bottom: 2px;
    }

    .title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }

    .kv {
      display: grid;
      grid-template-columns: 1fr;
      row-gap: 2px;
    }

    .line {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: flex-start;
    }

    .line .label {
      font-weight: 600;
      min-width: 80px;
      flex-shrink: 0;
    }

    .line .value {
      text-align: right;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .section-title {
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 0.2px;
    }

    .item {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 8px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: flex-start;
    }

    .item-meta {
      min-width: 0;
      flex: 1;
    }

    .description {
      font-weight: 600;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .method {
      font-size: 10px;
      margin-top: 1px;
      color: #111;
    }

    .amount {
      min-width: 80px;
      text-align: right;
      font-weight: 600;
      white-space: nowrap;
    }

    .bank-info {
      margin-top: 4px;
      padding-left: 6px;
      border-left: 1px dashed #000;
      font-size: 10px;
      display: grid;
      row-gap: 1px;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .totals {
      margin-top: 2px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-weight: 700;
      font-size: 12px;
    }

    .remarks {
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .footer {
      margin-top: 10px;
      font-size: 10px;
      text-align: center;
    }

    @media print {
      html,
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    @media print and (min-width: 210mm) {
      body {
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center company">${escapeHtml(company_name)}</div>
    <div class="center title">PAYMENT REQUEST</div>

    <div class="kv">
      <div class="line"><span class="label">PRF No</span><span class="value">${escapeHtml(reference_no || "-")}</span></div>
      <div class="line"><span class="label">Date</span><span class="value">${escapeHtml(formatDate(request_date))}</span></div>
      <div class="line"><span class="label">Status</span><span class="value">${escapeHtml(labelStatus(status))}</span></div>
      <div class="line"><span class="label">Vendor/Payee</span><span class="value">${escapeHtml(vendor_name || "-")}</span></div>
      <div class="line"><span class="label">Requestor</span><span class="value">${escapeHtml(requester_name || "-")}</span></div>
    </div>

    <div class="divider"></div>
    <div class="section-title">Breakdown</div>
    ${itemsHtml || `<div class="item"><div class="description">-</div></div>`}

    <div class="divider"></div>
    <div class="totals">
      <div class="total-row"><span>TOTAL AMOUNT</span><span>${escapeHtml(formatMoneyPHP(total_amount))}</span></div>
    </div>

    ${remarksHtml}

    <div class="divider"></div>
    <div class="footer">
      <div>Printed: ${escapeHtml(printedAt)}</div>
      <div>Thank you!</div>
    </div>
  </div>
</body>
</html>`;
}
