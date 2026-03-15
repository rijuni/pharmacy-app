import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
           <div className="col-span-1 lg:col-span-2">
              <h2 className="text-2xl font-black text-emerald-deep tracking-tighter mb-4">
                Health<span className="text-brand-500">Meds</span>
              </h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                 India's leading digital healthcare platform. From doctor consultations on chat to online pharmacy and lab tests at home: we have it all covered for you.
              </p>
              <div className="flex gap-4">
                 <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-brand-100 text-gray-600 hover:text-brand-600 transition-colors"><Facebook size={18}/></a>
                 <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-brand-100 text-gray-600 hover:text-brand-600 transition-colors"><Twitter size={18}/></a>
                 <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-brand-100 text-gray-600 hover:text-brand-600 transition-colors"><Instagram size={18}/></a>
                 <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-brand-100 text-gray-600 hover:text-brand-600 transition-colors"><Youtube size={18}/></a>
                 <a href="#" className="bg-gray-200 p-2 rounded-full hover:bg-brand-100 text-gray-600 hover:text-brand-600 transition-colors"><Linkedin size={18}/></a>
              </div>
           </div>
           
           <div>
              <h4 className="font-bold text-gray-900 mb-4">Know Us</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                 <li><a href="#" className="hover:text-brand-500">About Us</a></li>
                 <li><a href="#" className="hover:text-brand-500">Contact Us</a></li>
                 <li><a href="#" className="hover:text-brand-500">Press Coverage</a></li>
                 <li><a href="#" className="hover:text-brand-500">Careers</a></li>
                 <li><a href="#" className="hover:text-brand-500">Business Partnership</a></li>
              </ul>
           </div>
           
           <div>
              <h4 className="font-bold text-gray-900 mb-4">Our Policies</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                 <li><a href="#" className="hover:text-brand-500">Privacy Policy</a></li>
                 <li><a href="#" className="hover:text-brand-500">Terms and Conditions</a></li>
                 <li><a href="#" className="hover:text-brand-500">Editorial Policy</a></li>
                 <li><a href="#" className="hover:text-brand-500">Return Policy</a></li>
                 <li><a href="#" className="hover:text-brand-500">IP Policy</a></li>
              </ul>
           </div>

           <div>
              <h4 className="font-bold text-gray-900 mb-4">Our Services</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                 <li><a href="#" className="hover:text-brand-500">Order Medicines</a></li>
                 <li><a href="#" className="hover:text-brand-500">Book Lab Tests</a></li>
                 <li><a href="#" className="hover:text-brand-500">Consult a Doctor</a></li>
                 <li><a href="#" className="hover:text-brand-500">Ayurveda Articles</a></li>
              </ul>
           </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-sm text-gray-500 text-center md:text-left">
              © 2026 HealthMeds. All rights reserved. In compliance with Drugs and Cosmetics Act, 1940 and Drugs and Cosmetics Rules, 1945. Strict 3km delivery limit.
           </p>
           <div className="flex gap-4 items-center">
              <span className="font-bold text-gray-600 text-sm">Download App</span>
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-8 shadow-sm rounded"/>
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-8 shadow-sm rounded"/>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
