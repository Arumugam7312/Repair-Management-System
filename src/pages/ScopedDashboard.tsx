import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Wrench, CheckCircle, Clock, ShieldCheck, ShieldAlert,
  ArrowLeft, Calendar, User, CreditCard, ChevronRight, MessageSquare, AlertCircle, Sparkles
} from 'lucide-react';
import { RepairTicket, Device, Customer, StatusHistory, Invoice } from '../types';

export default function ScopedDashboard() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loaded Details
  const [ticket, setTicket] = useState<RepairTicket | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<StatusHistory[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Interactive Estimate Responses
  const [estimateActionLoading, setEstimateActionLoading] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const token = localStorage.getItem('repairhub_token');

  useEffect(() => {
    if (!token) {
      navigate('/track');
      return;
    }
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Unauthorized or expired tracking token');
      }

      setTicket(data.ticket);
      setDevice(data.device);
      setCustomer(data.customer);
      setTimeline(data.timeline);
      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to load scoped ticket dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateResponse = async (action: 'Approve' | 'Reject') => {
    if (!ticket) return;
    setEstimateActionLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/v1/tickets/${ticket.id}/estimate-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          notes: customerNotes.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Submission failed');
      }

      setActionSuccess(`Successfully ${action}d the estimate. We are notifying our workshop technicians immediately.`);
      setCustomerNotes('');
      fetchTicketDetails(); // Reload details
    } catch (err: any) {
      setError(err.message || 'Failed to submit estimate response');
    } finally {
      setEstimateActionLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; bg: string; text: string; stepIdx: number }> = {
    Booked: { label: 'Ticket Booked', bg: 'bg-gray-100', text: 'text-gray-800', stepIdx: 1 },
    Inspected: { label: 'Device Inspected', bg: 'bg-amber-100/70', text: 'text-amber-800', stepIdx: 2 },
    Estimate_Approved: { label: 'Estimate Approved', bg: 'bg-indigo-100', text: 'text-indigo-800', stepIdx: 3 },
    Estimate_Rejected: { label: 'Estimate Rejected', bg: 'bg-rose-100', text: 'text-rose-800', stepIdx: 3 },
    In_Repair: { label: 'Actively Fixing', bg: 'bg-blue-100', text: 'text-blue-800', stepIdx: 4 },
    Quality_Check: { label: 'Quality Audit', bg: 'bg-teal-100', text: 'text-teal-800', stepIdx: 5 },
    Ready_For_Pickup: { label: 'Ready for Pickup', bg: 'bg-emerald-100', text: 'text-emerald-800', stepIdx: 6 },
    Delivered: { label: 'Delivered', bg: 'bg-green-150', text: 'text-green-800', stepIdx: 7 },
    Cancelled: { label: 'Cancelled', bg: 'bg-gray-200', text: 'text-gray-700', stepIdx: 0 }
  };

  const steps = [
    { name: 'Booked', label: 'Booked' },
    { name: 'Inspected', label: 'Inspected' },
    { name: 'Approved', label: 'Approved' },
    { name: 'In Repair', label: 'In Repair' },
    { name: 'Ready', label: 'Ready' },
    { name: 'Delivered', label: 'Delivered' }
  ];

  const getStepActiveIndex = (status: string): number => {
    if (status === 'Booked') return 0;
    if (status === 'Inspected') return 1;
    if (status === 'Estimate_Approved') return 2;
    if (status === 'Estimate_Rejected') return 2;
    if (status === 'In_Repair') return 3;
    if (status === 'Quality_Check') return 3;
    if (status === 'Ready_For_Pickup') return 4;
    if (status === 'Delivered') return 5;
    return -1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <Wrench className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Loading live status board...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center max-w-sm space-y-4 shadow-sm">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="font-extrabold text-gray-950 text-lg">Access Token Expired</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {error || 'Your ticket-scoped secure session has expired. Please verify your mobile number again on the tracker page.'}
            </p>
          </div>
          <Link to="/track" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg transition">
            Go back to Tracker
          </Link>
        </div>
      </div>
    );
  }

  const activeIdx = getStepActiveIndex(ticket.status);

  return (
    <div className="font-sans min-h-screen bg-gray-50/50 pb-16 px-4" id="scoped-customer-dashboard">
      <div className="max-w-md mx-auto space-y-6 pt-6">
        
        {/* Navigation Head */}
        <div className="flex justify-between items-center">
          <Link to="/track" className="flex items-center space-x-1.5 text-xs font-bold text-gray-600">
            <ArrowLeft className="h-4 w-4" />
            <span>Tracker Portal</span>
          </Link>
          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Verified Scoped Login
          </div>
        </div>

        {/* Live status badge card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Repair Ticket No</span>
              <h2 className="text-lg font-black text-gray-900 font-mono tracking-tight">{ticket.ticketNumber}</h2>
            </div>
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${statusMap[ticket.status]?.bg || 'bg-gray-100'} ${statusMap[ticket.status]?.text || 'text-gray-800'}`}>
              {statusMap[ticket.status]?.label || ticket.status}
            </span>
          </div>

          {/* Graphical Step timeline for small devices */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Progress Timeline</span>
              <span className="text-blue-600">{activeIdx >= 0 ? `${Math.round(((activeIdx + 1) / steps.length) * 100)}%` : 'Processing'}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {steps.map((st, i) => (
                <div
                  key={st.name}
                  className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                    i <= activeIdx
                      ? ticket.status === 'Estimate_Rejected' && i === 2
                        ? 'bg-red-500'
                        : 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                  title={st.label}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-semibold">
              <span>Booked</span>
              <span>In Shop</span>
              <span>Fixed</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Cost estimate card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4" id="estimate-interaction-section">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Estimated Total Cost</span>
            <span className="text-xl font-black text-gray-950">₹{ticket.costEstimate || 'Pending Diagnosis'}</span>
          </div>

          {/* Interactive Approval panel for ESTIMATES */}
          {ticket.status === 'Inspected' && (
            <div className="border-t border-gray-100 pt-4 space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-950">
                <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                <span>Your approval is required to proceed</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Review the diagnosed issues listed below. You can approve or decline this estimate. No repair is started without your approval.
              </p>

              {actionSuccess ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3.5 rounded-lg flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{actionSuccess}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    placeholder="Provide any feedback or approval notes (optional)..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-white border border-gray-250 rounded-lg p-2 text-xs text-gray-800 outline-hidden"
                    rows={2}
                  />
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEstimateResponse('Approve')}
                      disabled={estimateActionLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex-1 transition"
                      id="estimate-approve-btn"
                    >
                      Approve & Repair
                    </button>
                    <button
                      onClick={() => handleEstimateResponse('Reject')}
                      disabled={estimateActionLoading}
                      className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs py-2.5 px-4 rounded-lg transition"
                      id="estimate-reject-btn"
                    >
                      Reject Quote
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {ticket.status === 'Estimate_Approved' && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>You approved this estimate. Repair work is actively scheduled.</span>
            </div>
          )}

          {ticket.status === 'Estimate_Rejected' && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>You declined this estimate. Our manager will call you for return delivery.</span>
            </div>
          )}
        </div>

        {/* Device metadata specs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Hardware Details</h3>
          
          <div className="grid grid-cols-2 gap-y-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Model / Brand</span>
              <span className="font-bold text-gray-950">{device?.brand} {device?.model}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Accessories Left</span>
              <span className="font-bold text-gray-800">{device?.accessories || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Assigned Engineer</span>
              <span className="font-bold text-blue-600">{ticket.assignedTechnicianId ? 'Devin L. (Senior Tech)' : 'Allocating specialist...'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">90-Day Parts Warranty</span>
              <span className="font-bold text-emerald-600">
                {ticket.status === 'Delivered' ? 'ACTIVE (90 Days)' : 'Eligible after fix'}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg space-y-1 border border-gray-150">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Diagnosed Hardware Issue</span>
            <p className="text-xs text-gray-700 leading-relaxed">{device?.issue}</p>
          </div>
        </div>

        {/* Live timeline status history list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Live Timeline logs</h3>

          <div className="space-y-4">
            {timeline.slice().reverse().map((step) => (
              <div key={step.id} className="relative flex space-x-3 items-start border-l-2 border-gray-150 pl-4 py-0.5">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-600" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-900 flex justify-between items-center w-full">
                    <span>{statusMap[step.status]?.label || step.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{new Date(step.createdAt).toLocaleString()}</p>
                  {step.notes && <p className="text-xs text-gray-600 italic">"{step.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice & Receipts downloads */}
        {invoice && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Billing & Receipts</h3>

            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-400 block">Invoice Number</span>
                <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Invoice Status</span>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {invoice.status === 'Paid' && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl border border-emerald-100 space-y-2">
                <div className="font-semibold flex items-center space-x-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Paid via {invoice.paymentMethod || 'UPI/Card'}</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-900/70">Transaction ID: {invoice.transactionId}</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
