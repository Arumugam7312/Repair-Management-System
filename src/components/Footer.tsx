import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Wrench, ShieldCheck, Clock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-900 font-sans" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-white font-bold text-xl tracking-tight" id="footer-logo">
              <Wrench className="h-6 w-6 text-blue-500" />
              <span className="text-white font-extrabold">RepairHub</span>
              <span className="bg-blue-600 text-white text-[9px] uppercase px-1.5 py-0.5 rounded-sm tracking-widest font-bold">Pro</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium diagnostic and motherboard level component-level micro-soldering repair workshop for all consumer electronics, backed by our absolute performance guarantee.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-md w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>Standard 90-Day Parts Warranty Included</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/book" className="hover:text-white transition">Mobile Screen Replacement</Link></li>
              <li><Link to="/book" className="hover:text-white transition">MacBook Motherboard Repairs</Link></li>
              <li><Link to="/book" className="hover:text-white transition">Laptop Chip Level Servicing</Link></li>
              <li><Link to="/book" className="hover:text-white transition">Data Recovery Specialists</Link></li>
              <li><Link to="/book" className="hover:text-white transition">Console Charging Port Repair</Link></li>
            </ul>
          </div>

          {/* Workshop Details */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Store Hours</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Mon - Sat: 9:00 AM - 8:00 PM</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span>Sunday: Closed (Emergencies only)</span>
              </li>
              <li className="mt-4 text-xs bg-gray-900 p-2.5 rounded-lg border border-gray-850">
                <span className="text-white font-semibold block mb-0.5">Quick Tracking Notice</span>
                Track repair progress instantly using Ticket ID and Mobile No.
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2.5">
                <MapPin className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-gray-400">123 Tech Boulevard, Phase II, Electronic City, Bangalore, KA - 560100</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-blue-500" />
                <span className="text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-gray-400">support@repairhubpro.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {currentYear} RepairHub Pro. All rights reserved. Built with pride for consumer hardware longevity.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="#" className="hover:text-gray-300">Privacy Policy</Link>
            <Link to="#" className="hover:text-gray-300">Terms of Service</Link>
            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-semibold">Staff Console</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
