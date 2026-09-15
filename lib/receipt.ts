export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  orderId: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  counterpartyLabel?: string;
  counterpartyValue?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  specialInstructions?: string;
  items: ReceiptLineItem[];
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString()}`;

export const getReceiptItemsFromOrder = (order: any): ReceiptLineItem[] => {
  const items: ReceiptLineItem[] = [];

  if (Array.isArray(order?.order_items)) {
    for (const item of order.order_items) {
      const name =
        item?.food?.name ||
        item?.deals?.deal_name ||
        (item?.item_type === "deal" ? "Deal Item" : "Food Item");

      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.unit_price || 0);
      const totalPrice = Number(item?.total_price || unitPrice * quantity);

      items.push({
        name,
        quantity,
        unitPrice,
        totalPrice,
      });
    }
  }

  if (Array.isArray(order?.order_deals)) {
    for (const dealItem of order.order_deals) {
      const name = dealItem?.deals?.deal_name || "Deal Item";
      const quantity = Number(dealItem?.quantity || 0);
      const unitPrice = Number(dealItem?.unit_price || 0);
      const totalPrice = Number(dealItem?.total_price || unitPrice * quantity);

      items.push({
        name,
        quantity,
        unitPrice,
        totalPrice,
      });
    }
  }

  return items;
};

export const printReceipt = (data: ReceiptData): void => {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=800,height=700");
  if (!printWindow) {
    alert("Please allow popups to print the receipt.");
    return;
  }

  const printableItems =
    data.items.length > 0
      ? data.items.map((item) => `
          <tr>
            <td class="item-name">${escapeHtml(item.name)}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">PKR ${formatCurrency(item.unitPrice)}</td>
            <td class="right bold">PKR ${formatCurrency(item.totalPrice)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="center muted">No line items available</td></tr>`;

  const createdDate = new Date(data.createdAt).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt #${data.orderId} — PlatePilot</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #f8faf4;
      color: #1d2d00;
      padding: 32px;
      font-size: 13px;
      line-height: 1.5;
    }

    .page {
      max-width: 680px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(29,45,0,0.10);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1d2d00 0%, #386641 100%);
      padding: 28px 32px 24px;
      color: #fff;
    }
    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .brand { font-size: 22px; font-weight: 900; color: #90cd1d; letter-spacing: -0.5px; }
    .tagline { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }
    .receipt-label {
      text-align: right;
    }
    .receipt-label .title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; }
    .receipt-label .order-id { font-size: 26px; font-weight: 900; color: #90cd1d; }
    .header-divider { border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 18px 0 16px; }
    .header-meta { display: flex; gap: 24px; flex-wrap: wrap; }
    .meta-item { }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); }
    .meta-value { font-size: 13px; font-weight: 600; color: #fff; margin-top: 2px; }
    .status-badge {
      display: inline-block;
      background: rgba(144,205,29,0.2);
      border: 1px solid rgba(144,205,29,0.4);
      color: #90cd1d;
      border-radius: 999px;
      padding: 2px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
      letter-spacing: 0.05em;
    }

    /* ── Body ── */
    .body { padding: 28px 32px; }

    /* Info grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .info-card {
      background: #f8faf4;
      border: 1px solid #e8f0d7;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .info-card.full { grid-column: 1 / -1; }
    .info-card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #386641; font-weight: 600; margin-bottom: 4px; }
    .info-card-value { font-size: 13px; font-weight: 500; color: #1d2d00; }

    /* Items table */
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #386641;
      font-weight: 700;
      margin-bottom: 10px;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #1d2d00; }
    thead th {
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #d6f0a4;
    }
    thead th.right { text-align: right; }
    thead th.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #e8f0d7; }
    tbody tr:nth-child(even) { background: #f8faf4; }
    tbody td { padding: 10px 12px; font-size: 13px; color: #1d2d00; }
    td.item-name { font-weight: 500; }
    td.center { text-align: center; }
    td.right { text-align: right; }
    td.bold { font-weight: 700; }
    td.muted { color: #999; }

    /* Total */
    .total-row {
      background: #1d2d00;
      border-radius: 0 0 10px 10px;
      padding: 14px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0;
    }
    .total-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #d6f0a4; }
    .total-amount { font-size: 22px; font-weight: 900; color: #90cd1d; }

    /* Footer */
    .footer {
      background: #f0f4e8;
      border-top: 1px solid #e8f0d7;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .footer-brand { font-size: 12px; font-weight: 700; color: #386641; }
    .footer-note { font-size: 11px; color: #1d2d00; opacity: 0.5; text-align: right; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="brand">PlatePilot</div>
          <div class="tagline">Eat Smart, Live Better</div>
        </div>
        <div class="receipt-label">
          <div class="title">Receipt</div>
          <div class="order-id">#${data.orderId}</div>
        </div>
      </div>
      <hr class="header-divider" />
      <div class="header-meta">
        <div class="meta-item">
          <div class="meta-label">Date</div>
          <div class="meta-value">${escapeHtml(createdDate)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="status-badge">${escapeHtml(data.status)}</span></div>
        </div>
        ${data.counterpartyLabel && data.counterpartyValue ? `
        <div class="meta-item">
          <div class="meta-label">${escapeHtml(data.counterpartyLabel)}</div>
          <div class="meta-value">${escapeHtml(data.counterpartyValue)}</div>
        </div>` : ""}
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <!-- Delivery info -->
      ${(data.deliveryAddress || data.phoneNumber || data.specialInstructions) ? `
      <div class="info-grid" style="margin-bottom:24px;">
        ${data.deliveryAddress ? `
        <div class="info-card full">
          <div class="info-card-label">Delivery Address</div>
          <div class="info-card-value">${escapeHtml(data.deliveryAddress)}</div>
        </div>` : ""}
        ${data.phoneNumber ? `
        <div class="info-card">
          <div class="info-card-label">Phone</div>
          <div class="info-card-value">${escapeHtml(data.phoneNumber)}</div>
        </div>` : ""}
        ${data.specialInstructions ? `
        <div class="info-card ${data.phoneNumber ? "" : "full"}">
          <div class="info-card-label">Special Instructions</div>
          <div class="info-card-value">${escapeHtml(data.specialInstructions)}</div>
        </div>` : ""}
      </div>` : ""}

      <!-- Items -->
      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="center">Qty</th>
            <th class="right">Unit Price</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${printableItems}
        </tbody>
      </table>
      <div class="total-row">
        <span class="total-label">Grand Total</span>
        <span class="total-amount">PKR ${formatCurrency(data.totalAmount)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">PlatePilot</div>
      <div class="footer-note">Thank you for your order!<br/>platepilot.app</div>
    </div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
