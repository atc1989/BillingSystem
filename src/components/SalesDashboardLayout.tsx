import React from "react";
import { Outlet } from "react-router-dom";

export function SalesDashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16">
        <div className="mx-auto max-w-[1440px] px-6 py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
