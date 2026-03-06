import React from "react";
import { Printer } from "lucide-react";

interface InventoryItem {
  name: string;
  ggTrans: string;
  pofNumber: string;
  packageType: { plat: number; gold: number; silver: number };
  retail: { bottle: number; blister: number; voucher: number; discount: number };
  bottles: number;
  blisters: number;
  released: { bottle: number; blister: number };
  toFollow: { bottle: number; blister: number };
  amount: number;
}

const inventoryData: InventoryItem[] = [
  {
    name: "Juan Dela Cruz",
    ggTrans: "GG-2024-001",
    pofNumber: "POF-12345",
    packageType: { plat: 1, gold: 0, silver: 0 },
    retail: { bottle: 2, blister: 5, voucher: 0, discount: 0 },
    bottles: 15,
    blisters: 30,
    released: { bottle: 10, blister: 20 },
    toFollow: { bottle: 5, blister: 10 },
    amount: 125000,
  },
  {
    name: "Maria Santos",
    ggTrans: "GG-2024-002",
    pofNumber: "POF-12346",
    packageType: { plat: 0, gold: 1, silver: 0 },
    retail: { bottle: 3, blister: 8, voucher: 1, discount: 0 },
    bottles: 20,
    blisters: 40,
    released: { bottle: 15, blister: 30 },
    toFollow: { bottle: 5, blister: 10 },
    amount: 85000,
  },
  {
    name: "Pedro Reyes",
    ggTrans: "GG-2024-003",
    pofNumber: "POF-12347",
    packageType: { plat: 0, gold: 0, silver: 2 },
    retail: { bottle: 1, blister: 3, voucher: 0, discount: 1 },
    bottles: 12,
    blisters: 25,
    released: { bottle: 8, blister: 18 },
    toFollow: { bottle: 4, blister: 7 },
    amount: 52000,
  },
  {
    name: "Anna Garcia",
    ggTrans: "GG-2024-004",
    pofNumber: "POF-12348",
    packageType: { plat: 1, gold: 0, silver: 0 },
    retail: { bottle: 4, blister: 10, voucher: 2, discount: 0 },
    bottles: 25,
    blisters: 50,
    released: { bottle: 20, blister: 40 },
    toFollow: { bottle: 5, blister: 10 },
    amount: 145000,
  },
  {
    name: "Luis Mendoza",
    ggTrans: "GG-2024-005",
    pofNumber: "POF-12349",
    packageType: { plat: 0, gold: 1, silver: 1 },
    retail: { bottle: 2, blister: 6, voucher: 0, discount: 1 },
    bottles: 18,
    blisters: 35,
    released: { bottle: 12, blister: 25 },
    toFollow: { bottle: 6, blister: 10 },
    amount: 95000,
  },
];

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

const renderDashForZero = (value: number): number | string => (value === 0 ? "-" : value);

export function InventoryReportPage() {
  const [isPrintHovered, setIsPrintHovered] = React.useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalAmount = inventoryData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #inventory-report-print, #inventory-report-print * {
            visibility: visible;
          }
          #inventory-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="mb-6 flex items-center justify-between">
        <h1
          style={{
            color: "#2E3A8C",
            fontSize: "20px",
            fontWeight: 500,
          }}
        >
          Inventory Report
        </h1>
        <button
          type="button"
          className="print:hidden flex items-center gap-2 px-6"
          onClick={() => window.print()}
          onMouseEnter={() => setIsPrintHovered(true)}
          onMouseLeave={() => setIsPrintHovered(false)}
          style={{
            backgroundColor: isPrintHovered ? "#1F2870" : "#2E3A8C",
            color: "#FFFFFF",
            height: "44px",
            borderRadius: "8px",
          }}
        >
          <Printer className="w-5 h-5" />
          <span
            style={{
              fontSize: "14px",
            }}
          >
            Print Report
          </span>
        </button>
      </div>

      <div id="inventory-report-print" className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8 pb-6 text-center" style={{ borderBottom: "2px solid #2E3A8C" }}>
          <h2
            style={{
              color: "#2E3A8C",
              fontSize: "24px",
              marginBottom: "8px",
            }}
          >
            Company Name
          </h2>
          <h3
            style={{
              color: "#374151",
              fontSize: "20px",
              marginBottom: "8px",
            }}
          >
            Inventory Report
          </h3>
          <p
            style={{
              color: "#6B7280",
              fontSize: "14px",
            }}
          >
            Report Date: {today}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F3F4F6" }}>
                <th
                  className="px-3 py-3 text-left"
                  style={{ color: "#374151", fontSize: "12px", minWidth: "120px" }}
                >
                  Name
                </th>
                <th
                  className="px-3 py-3 text-left"
                  style={{ color: "#374151", fontSize: "12px", minWidth: "100px" }}
                >
                  GG Trans No
                </th>
                <th
                  className="px-3 py-3 text-left"
                  style={{ color: "#374151", fontSize: "12px", minWidth: "100px" }}
                >
                  POF Number
                </th>
                <th
                  className="px-3 py-3 text-center"
                  colSpan={3}
                  style={{ color: "#374151", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Package Type
                </th>
                <th
                  className="px-3 py-3 text-center"
                  colSpan={4}
                  style={{ color: "#374151", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Retail Items
                </th>
                <th
                  className="px-3 py-3 text-right"
                  style={{ color: "#374151", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Bottles
                </th>
                <th className="px-3 py-3 text-right" style={{ color: "#374151", fontSize: "12px" }}>
                  Blisters
                </th>
                <th
                  className="px-3 py-3 text-center"
                  colSpan={2}
                  style={{ color: "#374151", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Released
                </th>
                <th
                  className="px-3 py-3 text-center"
                  colSpan={2}
                  style={{ color: "#374151", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  To Follow
                </th>
                <th
                  className="px-3 py-3 text-right"
                  style={{ color: "#374151", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Amount
                </th>
              </tr>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                <th colSpan={3} className="px-2 py-2" style={{ color: "#6B7280", fontSize: "12px" }} />
                <th
                  className="px-2 py-2 text-center"
                  style={{ color: "#6B7280", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Plat
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Gold
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Silver
                </th>
                <th
                  className="px-2 py-2 text-center"
                  style={{ color: "#6B7280", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Bottle
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Blister
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Voucher
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Disc.
                </th>
                <th className="px-2 py-2" style={{ color: "#6B7280", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }} />
                <th className="px-2 py-2" style={{ color: "#6B7280", fontSize: "12px" }} />
                <th
                  className="px-2 py-2 text-center"
                  style={{ color: "#6B7280", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Bottle
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Blister
                </th>
                <th
                  className="px-2 py-2 text-center"
                  style={{ color: "#6B7280", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }}
                >
                  Bottle
                </th>
                <th className="px-2 py-2 text-center" style={{ color: "#6B7280", fontSize: "12px" }}>
                  Blister
                </th>
                <th className="px-2 py-2" style={{ color: "#6B7280", fontSize: "12px", borderLeft: "1px solid #D0D5DD" }} />
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item) => (
                <tr key={item.ggTrans} className="border-t" style={{ borderColor: "#E5E7EB" }}>
                  <td className="px-3 py-3 text-left" style={{ fontSize: "12px" }}>
                    {item.name}
                  </td>
                  <td className="px-3 py-3 text-left" style={{ fontSize: "12px" }}>
                    {item.ggTrans}
                  </td>
                  <td className="px-3 py-3 text-left" style={{ fontSize: "12px" }}>
                    {item.pofNumber}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px", borderLeft: "1px solid #E5E7EB" }}>
                    {renderDashForZero(item.packageType.plat)}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {renderDashForZero(item.packageType.gold)}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {renderDashForZero(item.packageType.silver)}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px", borderLeft: "1px solid #E5E7EB" }}>
                    {renderDashForZero(item.retail.bottle)}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {renderDashForZero(item.retail.blister)}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {renderDashForZero(item.retail.voucher)}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {renderDashForZero(item.retail.discount)}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: "12px", borderLeft: "1px solid #E5E7EB" }}>
                    {item.bottles}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: "12px" }}>
                    {item.blisters}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px", borderLeft: "1px solid #E5E7EB" }}>
                    {item.released.bottle}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {item.released.blister}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px", borderLeft: "1px solid #E5E7EB" }}>
                    {item.toFollow.bottle}
                  </td>
                  <td className="px-3 py-3 text-center" style={{ fontSize: "12px" }}>
                    {item.toFollow.blister}
                  </td>
                  <td className="px-3 py-3 text-right" style={{ fontSize: "12px", borderLeft: "1px solid #E5E7EB" }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #2E3A8C", backgroundColor: "#F0F4FF" }}>
                <td colSpan={16} className="px-3 py-3 text-right" style={{ fontSize: "12px" }}>
                  <span style={{ color: "#2E3A8C" }}>Total Amount:</span>
                </td>
                <td
                  className="px-3 py-3 text-right"
                  style={{
                    borderLeft: "1px solid #2E3A8C",
                    color: "#2E3A8C",
                    fontSize: "14px",
                  }}
                >
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-12 pt-8" style={{ borderTop: "1px solid #D0D5DD" }}>
          <div>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "48px" }}>Prepared By:</p>
            <div style={{ borderTop: "1px solid #374151", paddingTop: "8px" }}>
              <p style={{ fontSize: "14px", textAlign: "center", color: "#374151" }}>Name & Signature</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "48px" }}>Checked By:</p>
            <div style={{ borderTop: "1px solid #374151", paddingTop: "8px" }}>
              <p style={{ fontSize: "14px", textAlign: "center", color: "#374151" }}>Name & Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
