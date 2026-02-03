import React, { useState } from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import { Navigation } from './Navigation';

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
  breakdowns?: Array<{
    category: string;
    description: string;
    amount: number;
  }>;
  reasonForPayment?: string;
  attachments?: string[];
  checkedBy?: string;
  approvedBy?: string;
  submittedDate?: string;
  approvedDate?: string;
}

const mockBills: Bill[] = [
  {
    id: '1',
    date: '01/28/2026',
    reference: 'PRF-012826-004',
    vendor: 'Kevlinda Empoy',
    purpose: 'Savings, Loan Assistance',
    paymentMethod: 'Bank Transfer',
    priority: 'Urgent',
    amount: 200000.00,
    status: 'Awaiting Approval',
    requestedBy: 'Kenny',
    bankName: 'BDO',
    accountHolder: 'Kevlinda Empoy',
    accountNumber: '1234567890',
    breakdowns: [
      { category: 'Savings', description: 'Monthly savings deposit', amount: 150000.00 },
      { category: 'Loan Assistance', description: 'Emergency loan assistance', amount: 50000.00 }
    ],
    reasonForPayment: 'Employee financial assistance for savings and emergency loan requirement.',
    attachments: ['PRF-012826-004-signed.pdf', 'ID-copy.jpg'],
    submittedDate: '01/28/2026'
  },
  {
    id: '2',
    date: '01/27/2026',
    reference: 'PRF-012726-003',
    vendor: 'Office Supplies Co.',
    purpose: 'Monthly office supplies purchase',
    paymentMethod: 'Check',
    priority: 'Standard',
    amount: 15750.00,
    status: 'Approved',
    requestedBy: 'Maria',
    breakdowns: [
      { category: 'Other', description: 'Office supplies - pens, paper, folders', amount: 15750.00 }
    ],
    reasonForPayment: 'Monthly office supplies replenishment for Q1 2026.',
    attachments: ['invoice-jan2026.pdf'],
    submittedDate: '01/27/2026',
    checkedBy: 'Finance Manager',
    approvedBy: 'CFO',
    approvedDate: '01/28/2026'
  },
  {
    id: '3',
    date: '01/25/2026',
    reference: 'PRF-012526-002',
    vendor: 'Tech Solutions Inc.',
    purpose: 'Software licensing renewal',
    paymentMethod: 'Bank Transfer',
    priority: 'High',
    amount: 85000.00,
    status: 'Paid',
    requestedBy: 'John',
    bankName: 'BPI',
    accountHolder: 'Tech Solutions Inc.',
    accountNumber: '9876543210',
    breakdowns: [
      { category: 'Other', description: 'Annual software license renewal', amount: 85000.00 }
    ],
    reasonForPayment: 'Annual renewal of accounting software licenses for 10 users.',
    attachments: ['license-invoice.pdf'],
    submittedDate: '01/25/2026',
    checkedBy: 'IT Manager',
    approvedBy: 'CFO',
    approvedDate: '01/26/2026'
  },
  {
    id: '4',
    date: '01/24/2026',
    reference: 'PRF-012426-001',
    vendor: 'Utility Company',
    purpose: 'Monthly electricity bill',
    paymentMethod: 'Bank Transfer',
    priority: 'Standard',
    amount: 12500.00,
    status: 'Paid',
    requestedBy: 'Admin',
    bankName: 'Metrobank',
    accountHolder: 'Utility Company',
    accountNumber: '5555123456',
    breakdowns: [
      { category: 'Other', description: 'January 2026 electricity consumption', amount: 12500.00 }
    ],
    reasonForPayment: 'Monthly electricity bill payment for office premises.',
    attachments: [],
    submittedDate: '01/24/2026',
    checkedBy: 'Admin',
    approvedBy: 'Finance Manager',
    approvedDate: '01/24/2026'
  },
  {
    id: '5',
    date: '01/23/2026',
    reference: 'PRF-012326-005',
    vendor: 'Cleaning Services Ltd.',
    purpose: 'Q1 cleaning services',
    paymentMethod: 'Cash',
    priority: 'Low',
    amount: 8000.00,
    status: 'Draft',
    requestedBy: 'Kenny',
    breakdowns: [
      { category: 'Other', description: 'Q1 2026 cleaning services', amount: 8000.00 }
    ],
    reasonForPayment: 'Quarterly cleaning services for office building.',
    attachments: []
  }
];

interface BillsPageProps {
  onLogout: () => void;
  onNavigateToCreateBill: () => void;
  onNavigateToViewBill: (bill: Bill) => void;
}

export function BillsPage({ onLogout, onNavigateToCreateBill, onNavigateToViewBill }: BillsPageProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['All', 'Draft', 'Awaiting Approval', 'Approved', 'Paid', 'Void'];

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Awaiting Approval':
        return 'bg-yellow-100 text-yellow-700';
      case 'Approved':
        return 'bg-blue-100 text-blue-700';
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Void':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: Bill['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Standard':
        return 'bg-blue-100 text-blue-700';
      case 'Low':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredBills = mockBills.filter(bill => {
    if (activeTab !== 'All' && bill.status !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        bill.vendor.toLowerCase().includes(query) ||
        bill.reference.toLowerCase().includes(query) ||
        bill.requestedBy.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="bills" onLogout={onLogout} />
      
      <div className="pt-16">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Payment Requests</h1>
              <p className="text-gray-600 mt-1">View and manage payment requests</p>
            </div>
            <button 
              onClick={onNavigateToCreateBill}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Bill
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by vendor, reference, or requester"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="From"
                />
              </div>
              <div>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Bills Table */}
          {filteredBills.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Reference No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Payee / Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Purpose Summary
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Requested By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBills.map((bill, index) => (
                      <tr
                        key={bill.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {bill.date}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                          {bill.reference}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {bill.vendor}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {bill.purpose}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {bill.paymentMethod}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                              bill.priority
                            )}`}
                          >
                            {bill.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 font-semibold text-right">
                          ₱{bill.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              bill.status
                            )}`}
                          >
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {bill.requestedBy}
                        </td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => onNavigateToViewBill(bill)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredBills.length} of {mockBills.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payment requests found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or create a new bill
              </p>
              <button 
                onClick={onNavigateToCreateBill}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Bill
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}