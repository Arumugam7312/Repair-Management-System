import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, CheckCircle, ShieldAlert, Sparkles, ChevronRight, ChevronLeft, ArrowRight, ClipboardCheck } from 'lucide-react';
import { z } from 'zod';

const bookingFormSchema = z.object({
  deviceType: z.string().min(1, 'Please select device type'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  imei: z.string().optional(),
  serialNumber: z.string().optional(),
  accessories: z.string().optional(),
  condition: z.string().min(3, 'Device condition description is required'),
  issue: z.string().min(5, 'Description of issue is required'),
  password: z.string().optional(),
  customerName: z.string().min(2, 'Full Name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerMobile: z.string().regex(/^\d{10}$/, 'Mobile must be exactly 10 digits')
});

export default function PublicBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [deviceType, setDeviceType] = useState('Mobile');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [accessories, setAccessories] = useState('');
  const [condition, setCondition] = useState('');
  const [issue, setIssue] = useState('');
  const [password, setPassword] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Success state
  const [successData, setSuccessData] = useState<{ ticketNumber: string; ticketId: string } | null>(null);

  const deviceTypes = ['Mobile', 'MacBook', 'Laptop', 'Console', 'Tablet', 'Smart TV', 'Other'];

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!deviceType) errors.deviceType = 'Device type selection is required';
      if (!brand.trim()) errors.brand = 'Brand is required (e.g. Apple, Samsung)';
      if (!model.trim()) errors.model = 'Model is required (e.g. iPhone 14 Pro, Galaxy S23)';
    } else if (currentStep === 2) {
      if (!condition.trim() || condition.trim().length < 3) {
        errors.condition = 'Please specify physical condition of the device';
      }
      if (!issue.trim() || issue.trim().length < 5) {
        errors.issue = 'Please detail the fault or symptom of the device';
      }
    } else if (currentStep === 3) {
      if (!customerName.trim() || customerName.trim().length < 2) {
        errors.customerName = 'Contact Name is required';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        errors.customerEmail = 'Please provide a valid email address';
      }
      if (!/^\d{10}$/.test(customerMobile)) {
        errors.customerMobile = 'Mobile must be exactly 10 digits';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      setError(null);
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setError(null);

    const payload = {
      deviceType,
      brand: brand.trim(),
      model: model.trim(),
      imei: imei.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      accessories: accessories.trim() || undefined,
      condition: condition.trim(),
      issue: issue.trim(),
      password: password.trim() || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerMobile: customerMobile.trim()
    };

    try {
      const response = await fetch('/api/v1/public/book-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error?.message || 'Server failed to record appointment');
      }

      setSuccessData({
        ticketNumber: resData.ticketNumber,
        ticketId: resData.ticketId
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Network error connection failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8" id="public-booking-container">
      <div className="max-w-2xl mx-auto">
        
        {/* Header Text */}
        {!successData && (
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Book Diagnostic Appointment</h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Tell us what needs fixing. We'll set aside bench space and assign a specialized hardware technician immediately.
            </p>
          </div>
        )}

        {/* Success Screen */}
        {successData ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl text-center space-y-6" id="booking-success-box">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                Booking Completed Successfully
              </div>
              <h2 className="text-2xl font-black text-gray-900">Your Appointment is Locked</h2>
              <p className="text-sm text-gray-500">
                A bench allocation confirmation and status tracker link have been dispatched to your email.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-250/60 p-5 rounded-xl space-y-4 max-w-sm mx-auto">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">Unique Repair Ticket Number</span>
                <span className="text-2xl font-black text-blue-600 tracking-tight font-mono">{successData.ticketNumber}</span>
              </div>
              
              <div className="border-t border-dashed border-gray-250 pt-3">
                <span className="text-xs text-gray-600 block">Use this Ticket ID to track repair timeline progress. No registration or password required.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link
                to={`/scoped/${successData.ticketId}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-lg transition"
                id="booking-success-track-cta"
              >
                Track Live Status
              </Link>
              <Link
                to="/"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm px-6 py-3 rounded-lg transition"
              >
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          /* Booking Multi-step Form Card */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
            
            {/* Step Progress indicators */}
            <div className="bg-gray-50/70 border-b border-gray-100 px-6 py-4 flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
                <span className={`font-semibold ${step === 1 ? 'text-blue-600' : ''}`}>Device Info</span>
              </div>
              <div className="h-[1px] w-12 bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                <span className={`font-semibold ${step === 2 ? 'text-blue-600' : ''}`}>Condition & Fault</span>
              </div>
              <div className="h-[1px] w-12 bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
                <span className={`font-semibold ${step === 3 ? 'text-blue-600' : ''}`}>Your Contact</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6" id="public-booking-form">
              
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-xs text-red-700 flex items-start space-x-2">
                  <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: Device Basics */}
              {step === 1 && (
                <div className="space-y-5" id="booking-step-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Device Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {deviceTypes.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDeviceType(t)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition ${deviceType === t ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Brand Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Apple, Dell, Lenovo"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className={`w-full bg-white border ${validationErrors.brand ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500`}
                        id="booking-brand-input"
                      />
                      {validationErrors.brand && <span className="text-[10px] text-red-600">{validationErrors.brand}</span>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Model Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. MacBook Air M2, iPhone 14"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className={`w-full bg-white border ${validationErrors.model ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500`}
                        id="booking-model-input"
                      />
                      {validationErrors.model && <span className="text-[10px] text-red-600">{validationErrors.model}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">IMEI (Mobiles only - optional)</label>
                      <input
                        type="text"
                        placeholder="15 digit IMEI code"
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Serial Number (optional)</label>
                      <input
                        type="text"
                        placeholder="Manufacturer S/N"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Accessories left with device (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Charger, Original Apple stylus pen, rugged rugged box"
                      value={accessories}
                      onChange={(e) => setAccessories(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Fault Details */}
              {step === 2 && (
                <div className="space-y-5" id="booking-step-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Physical Exterior Condition *</label>
                    <textarea
                      placeholder="e.g., Back glass completely shattered, hairline scratch on screen, perfect outer case"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className={`w-full bg-white border ${validationErrors.condition ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500 h-24`}
                      id="booking-condition-input"
                    />
                    <span className="text-[10px] text-gray-400 block">Detail any scratches or dents to avoid liability during intake.</span>
                    {validationErrors.condition && <span className="text-[10px] text-red-600">{validationErrors.condition}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Fault Description / Issues *</label>
                    <textarea
                      placeholder="e.g., Spilled green tea over keys. Powers up but display screen remains entirely black and keys are sticky."
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      className={`w-full bg-white border ${validationErrors.issue ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500 h-24`}
                      id="booking-issue-input"
                    />
                    {validationErrors.issue && <span className="text-[10px] text-red-600">{validationErrors.issue}</span>}
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase text-amber-800">
                      <Sparkles className="h-4 w-4" />
                      <span>Security & At-Rest Encryption</span>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-650 block">Device Password / PIN code (Highly optional)</label>
                      <input
                        type="text"
                        placeholder="Unlock sequence PIN / key"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-gray-250 rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500"
                        id="booking-password-input"
                      />
                      <span className="text-[10px] text-gray-500 block">Required only if motherboard diagnostic screen checks are needed. Decrypted strictly for authorized technician role.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Contact details */}
              {step === 3 && (
                <div className="space-y-5" id="booking-step-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your First and Last name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full bg-white border ${validationErrors.customerName ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500`}
                      id="booking-custname-input"
                    />
                    {validationErrors.customerName && <span className="text-[10px] text-red-600">{validationErrors.customerName}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address *</label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className={`w-full bg-white border ${validationErrors.customerEmail ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500`}
                        id="booking-custemail-input"
                      />
                      {validationErrors.customerEmail && <span className="text-[10px] text-red-600">{validationErrors.customerEmail}</span>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        placeholder="10 digit phone number"
                        value={customerMobile}
                        maxLength={10}
                        onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                        className={`w-full bg-white border ${validationErrors.customerMobile ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm text-gray-850 outline-hidden focus:border-blue-500`}
                        id="booking-custmobile-input"
                      />
                      {validationErrors.customerMobile && <span className="text-[10px] text-red-600">{validationErrors.customerMobile}</span>}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-xs text-gray-500 space-y-1">
                    <span className="font-semibold text-gray-700 block">Terms acknowledgment:</span>
                    <p>By submitting this form, you authorize RepairHub Pro technicians to run hardware diagnostic operations. No charges are applied until diagnostic reports are submitted and approved by you.</p>
                  </div>
                </div>
              )}

              {/* Form Navigation buttons */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex items-center space-x-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-250/70 py-2.5 px-4 rounded-lg transition"
                    id="booking-prev-btn"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 px-5 rounded-lg transition shadow-sm"
                    id="booking-next-btn"
                  >
                    <span>Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-lg transition shadow-md disabled:opacity-50"
                    id="booking-submit-btn"
                  >
                    {loading ? (
                      <span>Validating & Allocating...</span>
                    ) : (
                      <>
                        <ClipboardCheck className="h-4 w-4" />
                        <span>Confirm Appointment</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
