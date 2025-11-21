import React from 'react';
import { AppSettings } from '../types';

import { Mail, Globe, Shield, FileText, ExternalLink } from 'lucide-react';

interface Props {
  settings: AppSettings;
}

const Footer: React.FC<Props> = ({ settings }) => {

  const year = new Date().getFullYear();
  
  const hasCustomLinks = settings.footerLinks && settings.footerLinks.length > 0;

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Corporate Info */}
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              {settings.siteName}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              {settings.footerDescription || "Generating actionable knowledge through in-depth analysis and curated storytelling."}
            </p>
            <div className="flex items-center gap-4 pt-2">
               <a href="#" className="text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                  <Globe size={20} />
               </a>
               <a href={`mailto:${settings.contactEmail}`} className="text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                  <Mail size={20} />
               </a>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            
            {/* Categories */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Explore</h3>
              <ul className="space-y-3">
                {settings.navCategories.slice(0, 5).map(cat => (
                  <li key={cat}>
                    <button className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm">
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic Custom Links (Replaces Hardcoded Company) */}
            {hasCustomLinks && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Connect</h3>
                <ul className="space-y-3">
                  {settings.footerLinks.map((link, idx) => (
                    <li key={idx}>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm flex items-center gap-1"
                      >
                        {link.label} <ExternalLink size={10} className="opacity-50" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact / Legal */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Contact</h3>
              <ul className="space-y-3">
                <li>
                    <a href={`mailto:${settings.contactEmail}`} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm flex items-center gap-2">
                        {settings.contactEmail}
                    </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            © {year} {settings.siteName}. All rights reserved. Produced by AGTISA.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
                <Shield size={12} /> Privacy Policy
            </button>
            <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1">
                <FileText size={12} /> Terms of Service
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;