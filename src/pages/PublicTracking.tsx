import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Wrench, CheckCircle, Clock, Search, ShieldCheck, ShieldAlert,
  ArrowRight, Calendar, UserCheck, ShieldQuestion, HelpCircle, Eye
} from 'lucide-react';

interface TimelineStep {
  id: string;
  status: string;
  changedBy: string;
  notes?: string;
  createdAt: string;
}

export default function PublicTracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [trackerData, setTrackerData] = useState<{
    ticket: {
      id: string;
      ticketNumber: string;
      status: string;
      costEstimate: number;
      createdAt: string;
      updatedAt: string;
      assignedTechnicianName: string;
      qrCode?: string;
      barcode?: string;
    };
    device: {
      brand: string;
      model: string;
      condition: string;
      issue: string;
    } | null;
    customer: {
      name: string;
    } | null;
    timeline: TimelineStep[];
    invoice: {
      status: string;
      total: number;
    } | null;
  } | null>(null);

  // Lightweight Password-Free direct access trigger
  const [mobileConfirm, setMobileConfirm] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get('query') || searchParams.get('ticket');
    if (qParam) {
      setQuery(qParam);
      executeTracking(qParam);
    }
  }, [searchParams]);

  const executeTracking = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setLoading(true);
    setError(null);
    setTrackerData(null);
    
    try {
      const response = await fetch(`/api/v1/public/track-repair?query=${encodeURIComponent(searchStr.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to retrieve repair details. Double-check your ticket code.');
      }

      setTrackerData(data);
    } catch (err: any) {
      setError(err.message || 'No ticket matches details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTracking(query);
  };

  // LIGHTWEIGHT DIRECT LOGGING TRIGGER (Ticket + Mobile Combination, Section 8a)
  const handleScopedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerData) return;
    if (!mobileConfirm.trim()) {
      setAuthError('Please confirm registered 10-digit mobile number');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/v1/auth/ticket-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber: trackerData.ticket.ticketNumber,
          mobile: mobileConfirm.trim()
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error?.message || 'Validation failed. Check mobile number.');
      }

      // Save scoped JWT locally
      localStorage.setItem('repairhub_token', resData.token);
      localStorage.setItem('repair_scoped_ticket', resData.ticketId);
      
      // Notify parent app user update if available
      window.dispatchEvent(new Event('auth_change'));

      // Redirect directly to ticket-scoped dashboard page
      navigate(`/scoped/${resData.ticketId}`);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate scoped session');
    } finally {
      setAuthLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    Booked: { label: 'Ticket Booked', bg: 'bg-gray-100', text: 'text-gray-800' },
    Inspected: { label: 'Diagnostic Check', bg: 'bg-amber-50', text: 'text-amber-800' },
    Estimate_Approved: { label: 'Quote Approved', bg: 'bg-indigo-50', text: 'text-indigo-800' },
    Estimate_Rejected: { label: 'Quote Rejected', bg: 'bg-rose-50', text: 'text-rose-800' },
    In_Repair: { label: 'Actively Fixing', bg: 'bg-blue-50', text: 'text-blue-800' },
    Quality_Check: { label: 'Quality Audit', bg: 'bg-teal-50', text: 'text-teal-800' },
    Ready_For_Pickup: { label: 'Ready for Pickup', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    Delivered: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-800' },
    Cancelled: { label: 'Cancelled', bg: 'bg-gray-200', text: 'text-gray-700' }
  };

  return (
    <div className="font-sans min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8" id="public-tracking-container">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Intro Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Real-Time Repair Tracker</h1>
            <p className="text-sm text-gray-500">
              Check live workbench diagnostics and repair timelines instantly without registering.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto bg-white border border-gray-300 rounded-xl p-1.5 flex items-center shadow-xs">
            <div className="pl-3 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Enter Ticket Number (e.g. RHP-2026-1001) or Mobile..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-850 outline-hidden"
              id="tracking-query-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-lg transition shrink-0"
              id="tracking-query-submit"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs py-3 px-4 rounded-xl max-w-lg mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Live Search Result Timeline Dashboard */}
        {trackerData && (
          <div className="space-y-6" id="tracking-result-panel">
            
            {/* Top Status Header Box */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Ticket Reference</span>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{trackerData.ticket.ticketNumber}</h2>
                <p className="text-xs text-gray-550">
                  Registered: {new Date(trackerData.ticket.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Hardware Model</span>
                <div className="text-sm font-bold text-gray-950">
                  {trackerData.device?.brand} {trackerData.device?.model}
                </div>
                <p className="text-xs text-gray-500 italic max-w-xs truncate">
                  Issue: {trackerData.device?.issue}
                </p>
              </div>

              <div className="space-y-1 md:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block md:text-right">Live Workbench Status</span>
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${statusMap[trackerData.ticket.status]?.bg || 'bg-gray-100'} ${statusMap[trackerData.ticket.status]?.text || 'text-gray-800'}`}>
                  {statusMap[trackerData.ticket.status]?.label || trackerData.ticket.status}
                </span>
              </div>
            </div>

            {/* Main timeline tracker */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Status Timeline history</h3>

              <div className="flow-root">
                <ul className="-mb-8">
                  {trackerData.timeline.map((step, idx) => (
                    <li key={step.id}>
                      <div className="relative pb-8">
                        {idx !== trackerData.timeline.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                              <Clock className="h-4 w-4" />
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="text-sm font-bold text-gray-900 flex justify-between items-center">
                              <span>{statusMap[step.status]?.label || step.status}</span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                {new Date(step.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">By {step.changedBy}</p>
                            {step.notes && (
                              <p className="text-xs text-gray-700 bg-gray-50/70 p-2.5 rounded-lg border border-gray-150/50 mt-2 italic">
                                "{step.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* LIGHTWEIGHT PASSWORD-FREE ACCESS PROMPT (Section 8a Ticket-ID Login) */}
            <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-6 shadow-sm space-y-4" id="ticket-scoped-portal-card">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-150/40 p-2 rounded-lg text-amber-800">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950">Lightweight Customer Status Dashboard</h4>
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Verify ownership to unlock actions like **approving/rejecting cost estimates**, downloading tax invoices, checking 90-day warranty coverage, and leaving reviews on this ticket.
                  </p>
                </div>
              </div>

              <form onSubmit={handleScopedLogin} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-8">
                  <input
                    type="tel"
                    placeholder="Enter registered 10-digit mobile number..."
                    maxLength={10}
                    value={mobileConfirm}
                    onChange={(e) => setMobileConfirm(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-850 outline-hidden"
                    id="tracking-mobile-verification"
                  />
                  {authError && <span className="text-[10px] text-red-600 block mt-1">{authError}</span>}
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="sm:col-span-4 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-center space-x-1"
                  id="tracking-unlock-scoped-dashboard-btn"
                >
                  <Eye className="h-4 w-4" />
                  <span>{authLoading ? 'Verifying...' : 'Unlock Dashboard'}</span>
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
