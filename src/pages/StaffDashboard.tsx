import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench, Users, Wrench as ToolIcon, LayoutDashboard, ClipboardList, Package,
  TrendingUp, Settings, DollarSign, Bell, CheckCircle, ShieldAlert, Plus, Search,
  Filter, Eye, Edit2, LogOut, ArrowUpRight, BarChart3, AlertCircle, HelpCircle,
  Truck, FileText, Download, UserPlus, FileSpreadsheet, Lock, Unlock, Printer, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { User, RepairTicket, Device, Customer, Invoice, InventoryItem, Supplier, Expense, Settings as AppSettings, AppNotification } from '../types';

interface StaffDashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function StaffDashboard({ user, onLogout }: StaffDashboardProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('repairhub_token');

  const [activeTab, setActiveTab] = useState<'analytics' | 'tickets' | 'customers' | 'inventory' | 'expenses' | 'employees' | 'reports' | 'settings'>('analytics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [alerts, setAlerts] = useState<AppNotification[]>([]);

  // Search & Filters
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [custSearch, setCustSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');

  // Modals / Editing States
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateTechId, setUpdateTechId] = useState('');
  const [updateEstimate, setUpdateEstimate] = useState(0);
  const [updateNotes, setUpdateNotes] = useState('');
  const [ticketActionLoading, setTicketActionLoading] = useState(false);

  // Decryption trigger state
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});

  // Payment Simulation dialog
  const [simulatingInvoice, setSimulatingInvoice] = useState<Invoice | null>(null);
  const [simulatedPayMethod, setSimulatedPayMethod] = useState('UPI');
  const [simulatedDiscount, setSimulatedDiscount] = useState(0);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);

  // New item creation states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  const [showAddPart, setShowAddPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCat, setNewPartCat] = useState('Screens');
  const [newPartSku, setNewPartSku] = useState('');
  const [newPartQty, setNewPartQty] = useState(10);
  const [newPartMinQty, setNewPartMinQty] = useState(5);
  const [newPartPrice, setNewPartPrice] = useState(1500);
  const [newPartSupplier, setNewPartSupplier] = useState('');

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpCat, setNewExpCat] = useState('Tools');
  const [newExpAmount, setNewExpAmount] = useState(0);
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpMobile, setNewEmpMobile] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'Technician' | 'Receptionist' | 'Manager'>('Technician');
  const [newEmpPass, setNewEmpPass] = useState('staff123');
  const [newEmpPin, setNewEmpPin] = useState('1122');

  // Stock Movement Form
  const [recordingMovementItem, setRecordingMovementItem] = useState<any | null>(null);
  const [moveQty, setMoveQty] = useState(5);
  const [moveType, setMoveType] = useState<'IN' | 'OUT'>('IN');
  const [moveReason, setMoveReason] = useState('Restocked shipment');

  // Reports filters
  const [reportStart, setReportStart] = useState('2026-01-01');
  const [reportEnd, setReportEnd] = useState('2026-12-31');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadAllDashboardData();
  }, [activeTab]);

  const loadAllDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Get store settings first
      const setRes = await fetch('/api/v1/settings');
      const setD = await setRes.json();
      setSettings(setD);

      // Tab specific fetch
      if (activeTab === 'analytics') {
        const statsRes = await fetch('/api/v1/staff/dashboard-stats', { headers });
        const statsD = await statsRes.json();
        setStats(statsD);

        const alertRes = await fetch('/api/v1/notifications', { headers });
        const alertD = await alertRes.json();
        setAlerts(alertD);
      } else if (activeTab === 'tickets') {
        const ticketRes = await fetch('/api/v1/tickets', { headers });
        const ticketD = await ticketRes.json();
        setTickets(ticketD);

        const empRes = await fetch('/api/v1/employees', { headers });
        const empD = await empRes.json();
        setEmployees(empD);
      } else if (activeTab === 'customers') {
        const custRes = await fetch('/api/v1/customers', { headers });
        const custD = await custRes.json();
        setCustomers(custD);
      } else if (activeTab === 'inventory') {
        const invRes = await fetch('/api/v1/inventory', { headers });
        const invD = await invRes.json();
        setInventory(invD);

        const supRes = await fetch('/api/v1/suppliers', { headers });
        const supD = await supRes.json();
        setSuppliers(supD);
      } else if (activeTab === 'expenses') {
        const expRes = await fetch('/api/v1/expenses', { headers });
        const expD = await expRes.json();
        setExpenses(expD);
      } else if (activeTab === 'employees') {
        const empRes = await fetch('/api/v1/employees', { headers });
        const empD = await empRes.json();
        setEmployees(empD);
      } else if (activeTab === 'reports') {
        fetchReports();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to sync with workshop database server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/v1/reports?start=${reportStart}&end=${reportEnd}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReportData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    setTicketActionLoading(true);
    try {
      const response = await fetch(`/api/v1/tickets/${editingTicket.ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateStatus,
          assignedTechnicianId: updateTechId || undefined,
          costEstimate: updateEstimate,
          notes: updateNotes
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Update failed');

      setEditingTicket(null);
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleDecryptPassword = async (ticketId: string, encryptedValue: string) => {
    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.device?.passwordPlain) {
        setDecryptedPasswords(prev => ({
          ...prev,
          [ticketId]: data.device.passwordPlain
        }));
      }
    } catch (err) {
      console.error('Password decryption lookup failed', err);
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatingInvoice) return;

    try {
      const response = await fetch(`/api/v1/invoices/${simulatingInvoice.id}/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: simulatedPayMethod,
          discount: simulatedDiscount
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Payment simulation failed');

      setPaymentSuccessData(data);
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCustName, email: newCustEmail, mobile: newCustMobile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to save customer');

      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustMobile('');
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPartName,
          category: newPartCat,
          sku: newPartSku,
          quantity: newPartQty,
          minQuantity: newPartMinQty,
          price: newPartPrice,
          supplierId: newPartSupplier || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to save spare part');

      setShowAddPart(false);
      setNewPartName('');
      setNewPartSku('');
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingMovementItem) return;

    try {
      const response = await fetch(`/api/v1/inventory/${recordingMovementItem.id}/movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: moveQty,
          type: moveType,
          reason: moveReason
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Movement failed');

      setRecordingMovementItem(null);
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newExpCat,
          amount: newExpAmount,
          description: newExpDesc,
          date: new Date(newExpDate).toISOString()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Expense log failed');

      setShowAddExpense(false);
      setNewExpDesc('');
      setNewExpAmount(0);
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newEmpName,
          email: newEmpEmail,
          mobile: newEmpMobile,
          role: newEmpRole,
          password: newEmpPass,
          pinCode: newEmpPin
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Employee creation failed');

      setShowAddEmployee(false);
      setNewEmpName('');
      setNewEmpEmail('');
      setNewEmpMobile('');
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Settings update failed');

      alert('Business Settings updated successfully');
      loadAllDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportReportCSV = () => {
    if (!reportData) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Report Summary", `Start Date,${reportData.summary.startDate}`, `End Date,${reportData.summary.endDate}`, `Total Revenue,${reportData.summary.totalRevenue}`, `Total Expenses,${reportData.summary.totalExpenses}`, `Net Profit,${reportData.summary.netProfit}`]
        .map(e => e).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `repairhub_pro_report_${reportStart}_to_${reportEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintReceipt = (invoiceId: string) => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    Booked: 'bg-gray-100 text-gray-800 border-gray-200',
    Inspected: 'bg-amber-100 text-amber-800 border-amber-200',
    Estimate_Approved: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Estimate_Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    In_Repair: 'bg-blue-100 text-blue-800 border-blue-200',
    Quality_Check: 'bg-teal-100 text-teal-800 border-teal-200',
    Ready_For_Pickup: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Delivered: 'bg-green-150 text-green-800 border-green-200',
    Cancelled: 'bg-gray-200 text-gray-700'
  };

  const navigationTabs = [
    { id: 'analytics', label: 'Analytics Hub', icon: LayoutDashboard },
    { id: 'tickets', label: 'Repair Tickets', icon: ClipboardList },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Spare Parts & Inventory', icon: Package },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'employees', label: 'Staff Roster', icon: UserPlus },
    { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Store Config', icon: Settings }
  ];

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.ticket.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                        t.customer?.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                        t.device?.model.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchStatus = ticketStatusFilter === 'ALL' || t.ticket.status === ticketStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.mobile.includes(custSearch) ||
    c.email.toLowerCase().includes(custSearch.toLowerCase())
  );

  const filteredInventory = inventory.filter(i =>
    i.name.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.sku.toLowerCase().includes(invSearch.toLowerCase())
  );

  return (
    <div className="font-sans min-h-screen bg-gray-50 flex flex-col md:flex-row" id="staff-workspace-wrapper">
      
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="w-full md:w-64 bg-gray-950 text-gray-400 flex flex-col justify-between shrink-0 border-r border-gray-900" id="staff-sidebar">
        <div>
          <div className="p-6 border-b border-gray-900">
            <Link to="/" className="flex items-center space-x-2 text-white font-sans font-bold text-lg tracking-tight" id="sidebar-logo">
              <Wrench className="h-5 w-5 text-blue-500" />
              <span className="text-white font-extrabold">RepairHub</span>
              <span className="bg-blue-600 text-white text-[9px] uppercase px-1.5 py-0.5 rounded-sm tracking-widest font-bold">Pro</span>
            </Link>
            <div className="mt-3 text-[10px] text-gray-500 uppercase tracking-widest font-black">
              Logged in: <span className="text-blue-400 font-bold">{user?.role}</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navigationTabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${activeTab === tab.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-900 hover:text-white'}`}
                  id={`sidebar-tab-btn-${tab.id}`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-900">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-950/20 hover:text-rose-400 transition"
            id="sidebar-logout-btn"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out console</span>
          </button>
        </div>
      </aside>

      {/* MAIN DATA STAGE CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8" id="staff-main-stage">
        
        {/* Header toolbar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-200 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">
              {navigationTabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-550">
              {settings?.businessName || 'RepairHub Pro'} Workshop console Panel
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-right hidden sm:block">
              <span className="font-bold text-gray-900 block">{user?.name || 'Authorized Staff'}</span>
              <span className="text-[10px] text-gray-400 font-medium font-mono">{user?.email}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-150 text-blue-800 flex items-center justify-center text-xs font-bold font-mono">
              {(user?.role || 'S').charAt(0)}
            </div>
          </div>
        </header>

        {/* Tab content conditional panels */}
        {loading ? (
          <div className="py-20 text-center">
            <ToolIcon className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2 font-semibold">Syncing with hardware workshop database...</p>
          </div>
        ) : (
          <div id="tab-content-panel">
            
            {/* 1. ANALYTICS HUB TAB */}
            {activeTab === 'analytics' && stats && (
              <div className="space-y-8" id="tab-analytics-panel">
                {/* Metrics strip cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Cumulative Revenue', value: `${settings?.currencySymbol || '₹'}${stats.metrics.totalRevenue.toLocaleString()}`, color: 'text-emerald-600', icon: DollarSign },
                    { label: 'Pending repairs', value: stats.metrics.pendingRepairs, color: 'text-blue-600', icon: Clock },
                    { label: 'Completed Repairs', value: stats.metrics.completedRepairs, color: 'text-teal-600', icon: CheckCircle },
                    { label: 'Store Customers', value: stats.metrics.totalCustomers, color: 'text-indigo-600', icon: Users }
                  ].map((card, i) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={i} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-gray-400">
                          <span className="text-[10px] uppercase font-bold tracking-wider">{card.label}</span>
                          <CardIcon className="h-4 w-4" />
                        </div>
                        <div className={`text-xl sm:text-2xl font-black ${card.color}`}>{card.value}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Revenue Line Chart */}
                  <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
                    <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Revenue Stream Timeline</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.charts.monthlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip />
                          <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} name="Revenue" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Device Brand Pie Chart */}
                  <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
                    <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Diagnostic Brand Intake Breakdown</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.charts.deviceTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {stats.charts.deviceTypeData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Low Stock and System notifications strip */}
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Active System Alerts</h3>
                  <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-2">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-3 text-center">No active hardware alerts logged.</p>
                    ) : (
                      alerts.map(al => (
                        <div key={al.id} className="py-3 flex justify-between items-center text-xs">
                          <div className="flex items-start space-x-2.5">
                            <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${al.read ? 'text-gray-400' : 'text-amber-500'}`} />
                            <div className="space-y-0.5">
                              <span className={`font-semibold block ${al.read ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{al.title}</span>
                              <p className="text-gray-500">{al.message}</p>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {new Date(al.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 2. REPAIR TICKETS TAB */}
            {activeTab === 'tickets' && (
              <div className="space-y-6" id="tab-tickets-panel">
                
                {/* Search / Filters toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                  <div className="flex-1 w-full relative flex items-center">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      placeholder="Search Ticket, Client, Model..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-850 outline-hidden"
                      id="ticket-search-box"
                    />
                  </div>
                  
                  <div className="flex space-x-2 w-full sm:w-auto shrink-0">
                    <select
                      value={ticketStatusFilter}
                      onChange={(e) => setTicketStatusFilter(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-hidden"
                      id="ticket-status-filter"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Booked">Booked</option>
                      <option value="Inspected">Inspected</option>
                      <option value="Estimate_Approved">Approved</option>
                      <option value="Estimate_Rejected">Rejected</option>
                      <option value="In_Repair">In Repair</option>
                      <option value="Ready_For_Pickup">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Tickets list */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="p-4">Ticket ID</th>
                          <th className="p-4">Customer Details</th>
                          <th className="p-4">Device Specs</th>
                          <th className="p-4">Est Cost</th>
                          <th className="p-4">Engineer</th>
                          <th className="p-4">Passwd At-Rest</th>
                          <th className="p-4">Live Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {filteredTickets.map(row => (
                          <tr key={row.ticket.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-bold font-mono text-gray-950">{row.ticket.ticketNumber}</td>
                            <td className="p-4">
                              <span className="font-semibold block text-gray-900">{row.customer?.name}</span>
                              <span className="text-[10px] text-gray-400 block font-mono">{row.customer?.mobile}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-gray-900 block">{row.device?.brand} {row.device?.model}</span>
                              <span className="text-[10px] text-gray-400 block truncate max-w-xs">{row.device?.issue}</span>
                            </td>
                            <td className="p-4 font-bold font-mono">₹{row.ticket.costEstimate}</td>
                            <td className="p-4 font-semibold text-blue-600">{row.technicianName || 'Unassigned'}</td>
                            <td className="p-4 font-mono text-[11px]">
                              {row.device?.password ? (
                                <div className="flex items-center space-x-1">
                                  <span>{decryptedPasswords[row.ticket.id] || '••••••••'}</span>
                                  <button
                                    onClick={() => handleDecryptPassword(row.ticket.id, row.device.password)}
                                    className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded"
                                    title="Decrypt device password strictly for technician verification"
                                  >
                                    <Lock className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColors[row.ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                                {row.ticket.status}
                              </span>
                            </td>
                            <td className="p-4 text-right flex items-center justify-end space-x-1.5 h-full">
                              <button
                                onClick={() => {
                                  setEditingTicket(row);
                                  setUpdateStatus(row.ticket.status);
                                  setUpdateTechId(row.ticket.assignedTechnicianId || '');
                                  setUpdateEstimate(row.ticket.costEstimate);
                                  setUpdateNotes(row.ticket.notes || '');
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit status / Assign Tech"
                                id={`edit-ticket-btn-${row.ticket.ticketNumber}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              
                              {row.invoice && (
                                <button
                                  onClick={() => setSimulatingInvoice(row.invoice)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition ${row.invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
                                  title="Dummy simulated payment portal"
                                  id={`bill-ticket-btn-${row.ticket.ticketNumber}`}
                                >
                                  {row.invoice.status === 'Paid' ? 'Paid' : 'Receive Pay'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredTickets.length === 0 && (
                      <p className="text-xs text-gray-400 italic py-8 text-center">No active repair tickets match filter criteria.</p>
                    )}
                  </div>
                </div>

                {/* Edit modal */}
                {editingTicket && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="edit-ticket-modal">
                    <div className="bg-white border border-gray-200 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h3 className="font-extrabold text-gray-950 text-base">Update Status: {editingTicket.ticket.ticketNumber}</h3>
                        <button onClick={() => setEditingTicket(null)} className="text-gray-400 hover:text-gray-900">×</button>
                      </div>

                      <form onSubmit={handleUpdateTicketSubmit} className="space-y-4" id="edit-ticket-form">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repair Status State</label>
                          <select
                            value={updateStatus}
                            onChange={(e) => setUpdateStatus(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden"
                            id="modal-update-status"
                          >
                            <option value="Booked">Booked</option>
                            <option value="Inspected">Inspected</option>
                            <option value="Estimate_Approved">Approved</option>
                            <option value="Estimate_Rejected">Rejected</option>
                            <option value="In_Repair">In Repair</option>
                            <option value="Ready_For_Pickup">Ready</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assign Technician Specialist</label>
                          <select
                            value={updateTechId}
                            onChange={(e) => setUpdateTechId(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden"
                            id="modal-update-tech"
                          >
                            <option value="">Choose Engineer...</option>
                            {employees.filter(emp => emp.role === 'Technician').map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} ({emp.mobile})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Total Cost (₹)</label>
                          <input
                            type="number"
                            value={updateEstimate}
                            onChange={(e) => setUpdateEstimate(Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden"
                            id="modal-update-estimate"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Technician fault diagnostics notes</label>
                          <textarea
                            placeholder="Detail diagnostics steps or component level replacement data..."
                            value={updateNotes}
                            onChange={(e) => setUpdateNotes(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs outline-hidden h-20"
                            id="modal-update-notes"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setEditingTicket(null)}
                            className="bg-gray-100 text-gray-800 font-bold text-xs px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={ticketActionLoading}
                            className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50"
                            id="modal-submit-update"
                          >
                            {ticketActionLoading ? 'Saving...' : 'Save Updates'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* simulated Payment dialog */}
                {simulatingInvoice && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="simulate-payment-modal">
                    <div className="bg-white border border-gray-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <h3 className="font-extrabold text-gray-950 text-sm">Collect Payment & Receipt</h3>
                        <button
                          onClick={() => {
                            setSimulatingInvoice(null);
                            setPaymentSuccessData(null);
                          }}
                          className="text-gray-400 hover:text-gray-950"
                        >
                          ×
                        </button>
                      </div>

                      {paymentSuccessData ? (
                        <div className="space-y-4 text-center" id="payment-success-box">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-950 text-base">Payment Captured</h4>
                            <p className="text-xs text-gray-500">Invoice successfully marked **PAID** on workshop server logs.</p>
                          </div>

                          <div className="bg-gray-50 border p-3 rounded-lg text-xs font-mono text-left space-y-1">
                            <div>Txn ID: {paymentSuccessData.transactionId}</div>
                            <div>Total: ₹{paymentSuccessData.invoice.total}</div>
                            <div>Method: {paymentSuccessData.invoice.paymentMethod}</div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => triggerPrintReceipt(paymentSuccessData.invoice.id)}
                              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs py-2 px-4 rounded-lg flex-1 flex items-center justify-center space-x-1"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Print Receipt</span>
                            </button>
                            <button
                              onClick={() => {
                                setSimulatingInvoice(null);
                                setPaymentSuccessData(null);
                              }}
                              className="bg-gray-100 text-gray-850 font-semibold text-xs py-2 px-4 rounded-lg"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSimulatePayment} className="space-y-4" id="simulate-payment-form">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Payment Method</label>
                            <select
                              value={simulatedPayMethod}
                              onChange={(e) => setSimulatedPayMethod(e.target.value)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            >
                              <option value="UPI">UPI (GPay/PhonePe)</option>
                              <option value="Card">Visa / Credit Card</option>
                              <option value="Cash">Cash in Hand</option>
                              <option value="Bank">Direct Wire transfer</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Add Discount (₹ - optional)</label>
                            <input
                              type="number"
                              value={simulatedDiscount}
                              onChange={(e) => setSimulatedDiscount(Number(e.target.value))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            />
                          </div>

                          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                            <strong>Note:</strong> Since this is a test sandbox, we bypass credit gateways and generate a simulated database transaction.
                          </div>

                          <div className="flex justify-end space-x-2 pt-2 border-t">
                            <button
                              type="button"
                              onClick={() => setSimulatingInvoice(null)}
                              className="bg-gray-100 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                            >
                              Simulate Success
                            </button>
                          </div>
                        </form>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 3. CUSTOMER PORTAL TAB */}
            {activeTab === 'customers' && (
              <div className="space-y-6" id="tab-customers-panel">
                
                {/* Search / Toolbar */}
                <div className="flex justify-between items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                  <div className="flex-1 max-w-sm relative flex items-center">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      placeholder="Search Client Name, Phone, Email..."
                      value={custSearch}
                      onChange={(e) => setCustSearch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-850 outline-hidden"
                      id="customer-search-box"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowAddCustomer(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shrink-0"
                    id="add-customer-trigger"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Intake Customer</span>
                  </button>
                </div>

                {/* Customers listing table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="p-4">Customer Name</th>
                          <th className="p-4">Mobile Number</th>
                          <th className="p-4">Email Address</th>
                          <th className="p-4">Registered Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {filteredCustomers.map(cust => (
                          <tr key={cust.id} className="hover:bg-gray-50/50">
                            <td className="p-4 font-semibold text-gray-900">{cust.name}</td>
                            <td className="p-4 font-mono font-bold text-gray-750">{cust.mobile}</td>
                            <td className="p-4 text-gray-600 font-mono">{cust.email}</td>
                            <td className="p-4 text-gray-400">
                              {new Date(cust.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                      <p className="text-xs text-gray-400 italic py-8 text-center">No customers registered match query criteria.</p>
                    )}
                  </div>
                </div>

                {/* Add Customer Modal */}
                {showAddCustomer && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-extrabold text-gray-950 text-sm">Register Intake Customer</h3>
                        <button onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-gray-950">×</button>
                      </div>

                      <form onSubmit={handleAddCustomer} className="space-y-4" id="add-customer-form">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newCustName}
                            onChange={(e) => setNewCustName(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                            id="new-cust-name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={newCustEmail}
                            onChange={(e) => setNewCustEmail(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                            id="new-cust-email"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number (10 digits) *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            value={newCustMobile}
                            onChange={(e) => setNewCustMobile(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                            id="new-cust-mobile"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowAddCustomer(false)}
                            className="bg-gray-100 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                            id="add-customer-submit"
                          >
                            Save Client
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 4. INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <div className="space-y-6" id="tab-inventory-panel">
                
                {/* Search / Action Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                  <div className="flex-1 w-full relative flex items-center">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      placeholder="Search Part Name, SKU code..."
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-850 outline-hidden"
                      id="inventory-search-box"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowAddPart(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center space-x-1 shrink-0 w-full sm:w-auto justify-center"
                    id="add-part-trigger"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Stock New Part</span>
                  </button>
                </div>

                {/* Spare parts grid list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredInventory.map(item => (
                    <div key={item.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{item.category}</span>
                          <span className="text-[11px] font-mono text-gray-400">SKU: {item.sku}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-950 leading-snug">{item.name}</h4>
                        <p className="text-[10px] text-gray-500">Supplier: {item.supplierName} {item.location ? `| Location: ${item.location}` : ''}</p>
                      </div>

                      <div className="border-t border-dashed border-gray-100 pt-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-gray-400 block font-semibold text-[10px]">Price per item</span>
                          <span className="font-extrabold font-mono text-gray-900">₹{item.price}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-semibold text-[10px]">Stock Level</span>
                          <span className={`font-black ${item.quantity <= item.minQuantity ? 'text-red-600 font-mono animate-pulse' : 'text-gray-950'}`}>
                            {item.quantity} in stock
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setRecordingMovementItem(item);
                            setMoveType('IN');
                            setMoveQty(10);
                            setMoveReason('Restocked supply order');
                          }}
                          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs py-2 rounded-lg border border-gray-200 transition"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => {
                            setRecordingMovementItem(item);
                            setMoveType('OUT');
                            setMoveQty(1);
                            setMoveReason('Used in repair task');
                          }}
                          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs py-2 rounded-lg border border-gray-200 transition"
                        >
                          Use Component
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredInventory.length === 0 && (
                    <p className="text-xs text-gray-400 italic py-8 text-center col-span-2">No spare parts match query.</p>
                  )}
                </div>

                {/* Add Part Modal */}
                {showAddPart && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-extrabold text-gray-950 text-sm">Add Spare Part to Stock</h3>
                        <button onClick={() => setShowAddPart(false)} className="text-gray-400 hover:text-gray-950">×</button>
                      </div>

                      <form onSubmit={handleAddPart} className="space-y-4" id="add-part-form">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Part Name *</label>
                          <input
                            type="text"
                            required
                            value={newPartName}
                            onChange={(e) => setNewPartName(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                            id="new-part-name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                            <select
                              value={newPartCat}
                              onChange={(e) => setNewPartCat(e.target.value)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            >
                              <option value="Screens">Screens</option>
                              <option value="Batteries">Batteries</option>
                              <option value="Logic Board ICs">ICs / PMIC</option>
                              <option value="Charging Boards">Ports</option>
                              <option value="Accessories">Accessories</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">SKU Code *</label>
                            <input
                              type="text"
                              required
                              value={newPartSku}
                              onChange={(e) => setNewPartSku(e.target.value)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                              id="new-part-sku"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Supplier</label>
                            <select
                              value={newPartSupplier}
                              onChange={(e) => setNewPartSupplier(e.target.value)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            >
                              <option value="">Select supplier...</option>
                              {suppliers.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Price per unit (₹) *</label>
                            <input
                              type="number"
                              required
                              value={newPartPrice}
                              onChange={(e) => setNewPartPrice(Number(e.target.value))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Quantity *</label>
                            <input
                              type="number"
                              required
                              value={newPartQty}
                              onChange={(e) => setNewPartQty(Number(e.target.value))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Min Limit *</label>
                            <input
                              type="number"
                              required
                              value={newPartMinQty}
                              onChange={(e) => setNewPartMinQty(Number(e.target.value))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowAddPart(false)}
                            className="bg-gray-100 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                            id="add-part-submit"
                          >
                            Add to stock
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Stock Movement Dialog */}
                {recordingMovementItem && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-extrabold text-gray-950 text-sm">Log Stock Movement</h3>
                        <button onClick={() => setRecordingMovementItem(null)} className="text-gray-400 hover:text-gray-950">×</button>
                      </div>

                      <form onSubmit={handleRecordMovement} className="space-y-4">
                        <div className="text-xs bg-gray-50 p-2 rounded">
                          <strong>Item:</strong> {recordingMovementItem.name} (SKU: {recordingMovementItem.sku})
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Movement Type</label>
                            <select
                              value={moveType}
                              onChange={(e) => setMoveType(e.target.value as any)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            >
                              <option value="IN">IN (Restock)</option>
                              <option value="OUT">OUT (Use/Damage)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Quantity *</label>
                            <input
                              type="number"
                              required
                              value={moveQty}
                              onChange={(e) => setMoveQty(Number(e.target.value))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Reason / Task details *</label>
                          <input
                            type="text"
                            required
                            value={moveReason}
                            onChange={(e) => setMoveReason(e.target.value)}
                            placeholder="Used in ticket RHP-2026-1001"
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setRecordingMovementItem(null)}
                            className="bg-gray-100 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                          >
                            Confirm log
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 5. EXPENSES TAB */}
            {activeTab === 'expenses' && (
              <div className="space-y-6" id="tab-expenses-panel">
                
                <div className="flex justify-between items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                  <div className="text-xs text-gray-500 font-semibold">
                    Total Logged Expenses: ₹{expenses.reduce((s, e) => s + Number(e.amount), 0)}
                  </div>
                  
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shrink-0"
                    id="add-expense-trigger"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Log Workshop Expense</span>
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="p-4">Category</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Date logged</th>
                          <th className="p-4">Created By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {expenses.map(exp => (
                          <tr key={exp.id}>
                            <td className="p-4 font-bold text-gray-950">{exp.category}</td>
                            <td className="p-4 font-mono font-black text-rose-600">₹{exp.amount}</td>
                            <td className="p-4 text-gray-500">{exp.description || 'No description'}</td>
                            <td className="p-4">{new Date(exp.date).toLocaleDateString()}</td>
                            <td className="p-4 text-gray-400">{exp.createdBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Expense Modal */}
                {showAddExpense && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-extrabold text-gray-950 text-sm">Log Workshop Expense</h3>
                        <button onClick={() => setShowAddExpense(false)} className="text-gray-400 hover:text-gray-950">×</button>
                      </div>

                      <form onSubmit={handleAddExpense} className="space-y-4" id="add-expense-form">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
                          <select
                            value={newExpCat}
                            onChange={(e) => setNewExpCat(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                          >
                            <option value="Tools">Tools & Consumables</option>
                            <option value="Rent">Rent / Space fee</option>
                            <option value="Utility">Electricity / Internet</option>
                            <option value="Refunds">Customer Refunds</option>
                            <option value="Marketing">Advertising & Posters</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Amount (₹) *</label>
                          <input
                            type="number"
                            required
                            value={newExpAmount}
                            onChange={(e) => setNewExpAmount(Number(e.target.value))}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Description *</label>
                          <input
                            type="text"
                            required
                            value={newExpDesc}
                            onChange={(e) => setNewExpDesc(e.target.value)}
                            placeholder="Electricity bill for January"
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Billing Date *</label>
                          <input
                            type="date"
                            required
                            value={newExpDate}
                            onChange={(e) => setNewExpDate(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowAddExpense(false)}
                            className="bg-gray-100 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                            id="add-expense-submit"
                          >
                            Save log
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 6. EMPLOYEES TAB */}
            {activeTab === 'employees' && (
              <div className="space-y-6" id="tab-employees-panel">
                
                <div className="flex justify-between items-center gap-4 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                  <div className="text-xs text-gray-500 font-semibold">
                    Current Active Staff members: {employees.length}
                  </div>
                  
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => setShowAddEmployee(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shrink-0"
                      id="add-employee-trigger"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Roster New Staff</span>
                    </button>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="p-4">Staff Name</th>
                          <th className="p-4">Assigned Role</th>
                          <th className="p-4">Mobile</th>
                          <th className="p-4">Console Email</th>
                          <th className="p-4">Unlock PIN code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {employees.map(emp => (
                          <tr key={emp.id}>
                            <td className="p-4 font-bold text-gray-950">{emp.name}</td>
                            <td className="p-4 font-semibold text-blue-600">{emp.role}</td>
                            <td className="p-4 font-mono font-bold text-gray-700">{emp.mobile}</td>
                            <td className="p-4 font-mono text-gray-400">{emp.email}</td>
                            <td className="p-4 font-mono text-gray-500 font-bold">{emp.pinCode || 'Unset'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Employee Modal */}
                {showAddEmployee && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-extrabold text-gray-950 text-sm">Roster New Staff Member</h3>
                        <button onClick={() => setShowAddEmployee(false)} className="text-gray-400 hover:text-gray-950">×</button>
                      </div>

                      <form onSubmit={handleAddEmployee} className="space-y-4" id="add-employee-form">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Staff Name *</label>
                          <input
                            type="text"
                            required
                            value={newEmpName}
                            onChange={(e) => setNewEmpName(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                            id="new-emp-name"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={newEmpEmail}
                              onChange={(e) => setNewEmpEmail(e.target.value)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                              id="new-emp-email"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number *</label>
                            <input
                              type="tel"
                              required
                              value={newEmpMobile}
                              onChange={(e) => setNewEmpMobile(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                              id="new-emp-mobile"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Workshop Role</label>
                            <select
                              value={newEmpRole}
                              onChange={(e) => setNewEmpRole(e.target.value as any)}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            >
                              <option value="Technician">Technician (Engineer)</option>
                              <option value="Receptionist">Receptionist (Intake)</option>
                              <option value="Manager">Manager</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Security PIN (4 digits) *</label>
                            <input
                              type="text"
                              maxLength={4}
                              required
                              value={newEmpPin}
                              onChange={(e) => setNewEmpPin(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white border rounded-lg p-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Login Password *</label>
                          <input
                            type="password"
                            required
                            value={newEmpPass}
                            onChange={(e) => setNewEmpPass(e.target.value)}
                            className="w-full bg-white border rounded-lg p-2 text-xs"
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowAddEmployee(false)}
                            className="bg-gray-100 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                            id="add-employee-submit"
                          >
                            Roster Staff
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 7. FINANCIAL REPORTS TAB */}
            {activeTab === 'reports' && reportData && (
              <div className="space-y-6" id="tab-reports-panel">
                
                {/* Custom Range Filter */}
                <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap gap-3 items-center text-xs">
                    <div>
                      <label className="font-bold text-gray-400 block mb-0.5">Start Date</label>
                      <input
                        type="date"
                        value={reportStart}
                        onChange={(e) => setReportStart(e.target.value)}
                        className="bg-white border p-2 rounded-lg outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-400 block mb-0.5">End Date</label>
                      <input
                        type="date"
                        value={reportEnd}
                        onChange={(e) => setReportEnd(e.target.value)}
                        className="bg-white border p-2 rounded-lg outline-hidden"
                      />
                    </div>
                    <button
                      onClick={fetchReports}
                      className="bg-blue-600 text-white font-bold px-4 py-2.5 rounded-lg mt-4 shrink-0 transition"
                      id="generate-report-btn"
                    >
                      Generate Range
                    </button>
                  </div>

                  <div className="flex space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={exportReportCSV}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 flex-1 sm:flex-none"
                      id="export-csv-btn"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Range summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Total revenue generated</span>
                    <div className="text-2xl font-black text-emerald-600">₹{reportData.summary.totalRevenue}</div>
                  </div>
                  <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Total tax amount collected</span>
                    <div className="text-2xl font-black text-gray-700">₹{reportData.summary.totalTaxCollected}</div>
                  </div>
                  <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Net Profit after Expenses</span>
                    <div className="text-2xl font-black text-blue-600">₹{reportData.summary.netProfit}</div>
                  </div>
                </div>

                {/* Invoices paid list in range */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Revenue transactions logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                          <th className="p-3">Invoice ID</th>
                          <th className="p-3">Ref Ticket</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">GST Tax ({settings?.taxRate}%)</th>
                          <th className="p-3">Total paid</th>
                          <th className="p-3">Method</th>
                          <th className="p-3 font-mono">Txn ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700">
                        {reportData.revenueInvoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="p-3 font-bold">{inv.invoiceNumber}</td>
                            <td className="p-3 font-mono">{inv.ticketId}</td>
                            <td className="p-3 font-mono">₹{inv.amount}</td>
                            <td className="p-3 font-mono text-gray-500">₹{inv.taxAmount}</td>
                            <td className="p-3 font-mono font-bold text-emerald-600">₹{inv.total}</td>
                            <td className="p-3">{inv.paymentMethod}</td>
                            <td className="p-3 font-mono text-gray-400 text-[11px]">{inv.transactionId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 8. SETTINGS TAB */}
            {activeTab === 'settings' && settings && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-2xl" id="tab-settings-panel">
                <form onSubmit={handleSaveSettings} className="space-y-6" id="settings-form">
                  <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider border-b pb-2">Business Metadata settings</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Contact Phone *</label>
                      <input
                        type="text"
                        required
                        value={settings.businessPhone}
                        onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Support Email *</label>
                      <input
                        type="email"
                        required
                        value={settings.businessEmail}
                        onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Tax Rate label *</label>
                      <input
                        type="text"
                        required
                        value={settings.taxLabel}
                        onChange={(e) => setSettings({ ...settings, taxLabel: e.target.value })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Currency Symbol</label>
                      <input
                        type="text"
                        required
                        value={settings.currencySymbol}
                        onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Currency Code</label>
                      <input
                        type="text"
                        required
                        value={settings.currencyCode}
                        onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">GST Tax Rate (%)</label>
                      <input
                        type="number"
                        required
                        value={settings.taxRate}
                        onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                        className="w-full bg-white border rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Workshop store address *</label>
                    <textarea
                      required
                      value={settings.businessAddress}
                      onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                      className="w-full bg-white border rounded-lg p-2.5 text-xs h-20"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition"
                      id="save-settings-btn"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
