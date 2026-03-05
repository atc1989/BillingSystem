import React from "react";
import { EncoderForm } from "./sales-dashboard/EncoderForm";
import type { SaleEntry } from "../types/sales";

type SalesDashboardEncoderPageProps = {
  onSave?: (entry: SaleEntry) => void;
  savedCount?: number;
};

export function SalesDashboardEncoderPage({
  onSave = () => {},
  savedCount = 0
}: SalesDashboardEncoderPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">New Sale Entry</h1>
        <p className="text-sm text-gray-600">Encode sale transactions.</p>
        <p className="text-xs text-gray-500 mt-1">Saved entries: {savedCount}</p>
      </div>
      <EncoderForm onSave={onSave} />
    </div>
  );
}
