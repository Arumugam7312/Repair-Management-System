import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench, CheckCircle, Clock, ShieldCheck, Phone, MapPin, Mail, Sparkles, ChevronRight,
  Tablet, Monitor, Cpu, Laptop, HardDrive, Tv, ShieldAlert, Star
} from 'lucide-react';

export default function PublicHome() {
  const navigate = useNavigate();
  const [trackQuery, setTrackQuery] = useState('');

  const services = [
    { name: 'MacBook Repair', icon: Laptop, desc: 'PMIC, short circuits, liquid spill recovery, and M1/M2/M3 processor servicing.' },
    { name: 'Mobile Phones', icon: Tablet, desc: 'Original AMOLED screen replacement, charging port restorations, battery module refreshes.' },
    { name: 'Laptop / PC', icon: Monitor, desc: 'BIOS flashing, RAM/SSD storage upgrades, GPU reballing, and hinges repairs.' },
    { name: 'Data Recovery', icon: HardDrive, desc: 'Retrieving secure data from corrupted hard disks, water-damaged logic boards, and flash drives.' },
    { name: 'Console Fixes', icon: Cpu, desc: 'HDMI port replacements, laser drive fixes, fan cleanups for PS5, Xbox Series X/S.' },
    { name: 'Smart TV Service', icon: Tv, desc: 'Backlight repairs, display board swapping, and firmware restoration.' }
  ];

  const stats = [
    { count: '14,000+', label: 'Repairs Completed' },
    { count: '99.2%', label: 'Success Rate' },
    { count: '2 Hour', label: 'Average Screen Swap' },
    { count: '90 Day', label: 'Warranty On All Parts' }
  ];

  const faqs = [
    { q: 'How long do repairs usually take?', a: 'Standard services like screen and battery replacements take 1-3 hours. Complex motherboard micro-soldering or extensive data recovery might take 2-4 business days depending on parts availability.' },
    { q: 'Do you charge if the device cannot be fixed?', a: 'No, we operate on a No-Fix, No-Fee policy. If our advanced diagnosis determines a device is unfixable, you pay absolutely nothing.' },
    { q: 'Is my personal data safe on the device?', a: 'We strictly respect your privacy. All passwords stored are encrypted at rest on our server. We recommend backing up data before drop-off if possible, but our technicians are fully trained in secure data preservation.' },
    { q: 'Do you use original replacement parts?', a: 'Yes, we source original parts directly from global distributors or use certified OEM-equivalent spares to ensure perfect compatibility and performance.' }
  ];

  const beforeAfters = [
    { title: 'iPhone 13 Display Restoration', issue: 'Shattered front panel, non-functional touchscreen.', solution: 'Full OEM screen assembly swap, biometric reprogram.', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80' },
    { title: 'MacBook liquid logic board repair', issue: 'Corrosion near PMIC from hot coffee spill.', solution: 'Ultrasonic board clean, replaced controller and 3 capacitors.', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80' }
  ];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackQuery.trim()) {
      navigate(`/track?query=${encodeURIComponent(trackQuery.trim())}`);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-white text-gray-900" id="public-home">
      
      {/* Hero Section */}
      <section className="relative bg-linear-to-b from-gray-50 to-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Bangalore\'s Premium Electronics Techs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Hardware fails.<br />
              <span className="text-blue-600">We make it brand new.</span>
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Professional, component-level motherboard diagnostic and repair workshop. Screens, batteries, liquid damage, and secure data recovery, backed by standard warranty.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/book"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl transition duration-150 flex items-center space-x-2 shadow-md shadow-blue-100"
                id="hero-book-repair-cta"
              >
                <span>Book Repair Now</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              
              <Link
                to="/track"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-semibold px-6 py-3.5 rounded-xl transition flex items-center space-x-2"
                id="hero-track-repair-cta"
              >
                <span>Track Active Repair</span>
              </Link>
            </div>

            {/* Quick Tracking Search Bar */}
            <form onSubmit={handleTrackSubmit} className="max-w-md bg-white border border-gray-200 rounded-xl p-1.5 flex items-center shadow-xs mt-6">
              <input
                type="text"
                placeholder="Enter Ticket ID or Mobile Number..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="w-full pl-3 pr-2 py-2 text-sm text-gray-850 outline-hidden"
                id="quick-track-input"
              />
              <button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shrink-0"
                id="quick-track-submit"
              >
                Track Live
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-1.5 bg-blue-600/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white border border-gray-150 rounded-2xl p-4 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=600&q=80"
                alt="State-of-the-art micro soldering repair tools"
                className="w-full h-80 object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-8 right-8 bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-850 max-w-xs space-y-1">
                <div className="flex text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                  <Star className="h-4 w-4 fill-amber-400" />
                </div>
                <p className="text-xs font-medium italic text-gray-300">
                  "Fixed my liquid damaged MacBook Pro in 24 hours. Saved me ₹65,000 Apple board swap quote."
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">- Amit K., Verified Customer</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-gray-950 text-white py-12 px-4 border-y border-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((st, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-500 font-mono">{st.count}</div>
              <div className="text-xs sm:text-sm text-gray-400 uppercase font-medium tracking-wider">{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Complete Repair Solutions Under One Roof
          </h2>
          <p className="text-gray-500">
            From quick screen swaps to high-end multi-layer motherboard re-soldering, our workbench handles it all.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv, idx) => {
            const IconComp = srv.icon;
            return (
              <div key={idx} className="bg-white border border-gray-150 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition duration-200 space-y-4">
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600">
                  <IconComp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-950">{srv.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{srv.desc}</p>
                <Link to="/book" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                  <span>Inquire service</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Our Structured Repair Process
            </h2>
            <p className="text-gray-500">
              We focus on absolute transparency at each stage of your repair workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 hidden md:block -translate-y-1/2 -z-0"></div>
            
            {[
              { step: '01', title: 'Intake Booking', desc: 'Securely register details online or walk in. Receive a unique tracker Ticket ID.' },
              { step: '02', title: 'Full Diagnostic', desc: 'Our technicians inspect under high magnification to pinpoint the motherboard fault.' },
              { step: '03', title: 'Approve Quote', desc: 'Review detailed price breakdown and approve directly via phone or Portal.' },
              { step: '04', title: 'Fix & Delivery', desc: 'We execute repair, run standard multi-point checks, and notify you for pickup.' }
            ].map((p, idx) => (
              <div key={idx} className="relative bg-white border border-gray-150 p-6 rounded-xl shadow-xs z-10 space-y-3">
                <span className="text-3xl font-black text-blue-100 font-mono block">{p.step}</span>
                <h3 className="text-base font-bold text-gray-950">{p.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Portfolio / Before After */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Featured Workshop Restorations
          </h2>
          <p className="text-gray-500">
            Real examples of extreme diagnostic saves from our soldering tables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {beforeAfters.map((ba, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col sm:flex-row bg-white">
              <img
                src={ba.image}
                alt={ba.title}
                className="w-full sm:w-48 h-48 object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-950 text-base">{ba.title}</h3>
                  <p className="text-xs text-red-600 font-medium mt-1">Issue: {ba.issue}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Fix: {ba.solution}</p>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">100% Function restored</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQS Accordion */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500">
              Got questions before drop-off? Find immediate answers here.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white border border-gray-150 rounded-xl p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex justify-between items-center font-bold text-gray-900 cursor-pointer list-none text-sm sm:text-base">
                  <span>{faq.q}</span>
                  <span className="transition group-open:rotate-180 text-blue-600 font-bold">+</span>
                </summary>
                <p className="text-sm text-gray-500 leading-relaxed mt-3 pt-3 border-t border-gray-100">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="bg-blue-650 rounded-3xl text-white p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-xl" style={{ backgroundColor: '#1e40af' }}>
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl"></div>
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to fix your hardware?</h2>
            <p className="text-blue-100 text-sm sm:text-base">
              Book a workbench reservation in under 2 minutes. Receive automated notifications and track diagnostic progress live.
            </p>
            <div className="pt-4 flex justify-center space-x-4">
              <Link to="/book" className="bg-white text-blue-700 font-bold text-sm px-6 py-3 rounded-lg hover:bg-gray-50 transition">
                Create a Ticket
              </Link>
              <Link to="/track" className="bg-blue-700/50 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-lg border border-blue-500 transition">
                Track Existing Ticket
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
