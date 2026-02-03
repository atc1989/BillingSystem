import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { BillsPage } from './components/BillsPage';
import { CreateBillPage } from './components/CreateBillPage';
import { ViewBillPage } from './components/ViewBillPage';
import { EditBillPage } from './components/EditBillPage';

type Page = 'login' | 'bills' | 'create-bill' | 'view-bill' | 'edit-bill';

interface Bill {
  id: string;
  date: string;
  reference: string;
  vendor: string;
  purpose: string;
  paymentMethod: string;
  priority: 'Urgent' | 'High' | 'Standard' | 'Low';
  amount: number;
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Paid' | 'Void';
  requestedBy: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  breakdowns: Array<{
    category: string;
    description: string;
    amount: number;
  }>;
  reasonForPayment: string;
  attachments: string[];
  checkedBy?: string;
  approvedBy?: string;
  submittedDate?: string;
  approvedDate?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const handleLogin = () => {
    setCurrentPage('bills');
  };

  const handleLogout = () => {
    setCurrentPage('login');
  };

  const handleNavigateToBills = () => {
    setCurrentPage('bills');
    setSelectedBill(null);
  };

  const handleNavigateToCreateBill = () => {
    setCurrentPage('create-bill');
  };

  const handleNavigateToViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setCurrentPage('view-bill');
  };

  const handleNavigateToEditBill = () => {
    setCurrentPage('edit-bill');
  };

  const handleSaveBill = () => {
    console.log('Bill saved');
    setCurrentPage('view-bill');
  };

  return (
    <>
      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
      {currentPage === 'bills' && (
        <BillsPage 
          onLogout={handleLogout}
          onNavigateToCreateBill={handleNavigateToCreateBill}
          onNavigateToViewBill={handleNavigateToViewBill}
          onNavigateToEditBill={handleNavigateToEditBill}
        />
      )}
      {currentPage === 'create-bill' && (
        <CreateBillPage
          onLogout={handleLogout}
          onBack={handleNavigateToBills}
        />
      )}
      {currentPage === 'view-bill' && selectedBill && (
        <ViewBillPage
          bill={selectedBill}
          onLogout={handleLogout}
          onBack={handleNavigateToBills}
          onEdit={handleNavigateToEditBill}
        />
      )}
      {currentPage === 'edit-bill' && selectedBill && (
        <EditBillPage
          bill={selectedBill}
          onLogout={handleLogout}
          onBack={handleNavigateToBills}
          onSave={handleSaveBill}
        />
      )}
    </>
  );
}