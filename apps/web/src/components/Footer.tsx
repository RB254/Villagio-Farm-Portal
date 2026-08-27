import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#184037] text-white pt-12 pb-6 border-t-4 border-[#ed7423] mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Column 1: Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ed7423] flex items-center justify-center text-white font-black text-lg">
              V
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-none text-white">
                Villagi<span className="text-[#ed7423]">o</span>
              </div>
              <div className="text-[9px] uppercase font-bold tracking-widest text-[#f6b787] leading-none">
                Farm Fresh
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Connecting African smallholder farmers directly to high-volume buyers. Automated zero-inventory marketplace model.
          </p>
          <div className="text-xs text-[#f6b787] font-semibold pt-1">
            📍 Nairobi • Kiambu • Murang'a • Nakuru
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="font-bold text-sm text-[#f6b787] uppercase tracking-wider mb-3">Farmer Quick Links</h4>
          <ul className="space-y-2 text-xs text-emerald-100/90">
            <li><Link to="/farmer/sell" className="hover:text-white transition-colors">Sell Produce</Link></li>
            <li><Link to="/farmer/produce" className="hover:text-white transition-colors">My Produce Submissions</Link></li>
            <li><Link to="/farmer/collections" className="hover:text-white transition-colors">Track F.T.M.A Collections</Link></li>
            <li><Link to="/farmer/payments" className="hover:text-white transition-colors">M-Pesa Payout Statements</Link></li>
            <li><Link to="/farmer/help" className="hover:text-white transition-colors">FAQs & Support Hotline</Link></li>
          </ul>
        </div>

        {/* Column 3: Multi-Channel Portals */}
        <div>
          <h4 className="font-bold text-sm text-[#f6b787] uppercase tracking-wider mb-3">Multi-Channel Access</h4>
          <ul className="space-y-2 text-xs text-emerald-100/90">
            <li><span className="text-white font-medium">📟 USSD Dial:</span> <code className="bg-[#0f2923] text-amber-300 px-1.5 py-0.5 rounded">*384*100#</code></li>
            <li><span className="text-white font-medium">📞 IVR Voice Call:</span> <code className="bg-[#0f2923] text-orange-300 px-1.5 py-0.5 rounded">0800 720 000</code></li>
            <li><span className="text-white font-medium">💬 SMS Intake:</span> <code className="bg-[#0f2923] text-emerald-300 px-1.5 py-0.5 rounded">SMS to 22384</code></li>
            <li><Link to="/admin" className="text-[#ed7423] font-semibold hover:underline mt-2 inline-block">🛡️ Admin & Simulator Console ➔</Link></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div>
          <h4 className="font-bold text-sm text-[#f6b787] uppercase tracking-wider mb-3">Stay Updated</h4>
          <p className="text-xs text-emerald-100/80 mb-3">
            Get market prices, crop demand alerts, and harvest schedules directly via SMS.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter phone or email"
              className="bg-[#0f2923] text-white text-xs px-3 py-2 rounded-lg border border-[#23594e] focus:outline-none focus:border-[#ed7423] flex-1"
            />
            <button className="bg-[#ed7423] hover:bg-[#db6314] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 border-t border-[#23594e] flex flex-col sm:flex-row justify-between items-center text-[11px] text-emerald-200/70 gap-2">
        <div>© 2026 Villagio Farm Fresh Ltd. All Rights Reserved.</div>
        <div className="flex gap-4">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span className="hover:underline cursor-pointer">Compliance</span>
        </div>
      </div>
    </footer>
  );
};
