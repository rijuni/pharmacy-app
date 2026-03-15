import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, PhoneCall, ArrowRight, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ThreeScene from '../components/ThreeScene';

const Home = () => {
   // Dummy featured products to show on home page
   const featuredMedicines = [
      { id: 1, name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', image: '', price: 150.00, discount_price: 120.00, requires_prescription: true },
      { id: 2, name: 'Paracetamol 650mg', generic_name: 'Paracetamol', image: '', price: 40.00, discount_price: 35.00, requires_prescription: false },
      { id: 3, name: 'Vitamin C Zinc', generic_name: 'Ascorbic Acid', image: '', price: 180.00, discount_price: 150.00, requires_prescription: false },
      { id: 4, name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', image: '', price: 80.00, discount_price: 70.00, requires_prescription: false },
   ];

   const healthConcerns = [
      { name: 'Diabetes Care', img: 'https://onemg.gumlet.io/a_ignore,w_150,h_150,c_fit,q_auto,f_auto/c2a0598f-483c-48ff-9783-71e402aa28d3.png' },
      { name: 'Cardiac Care', img: 'https://onemg.gumlet.io/a_ignore,w_150,h_150,c_fit,q_auto,f_auto/ab1da5f4-c074-47d2-b278-a5fbd2c93f1f.png' },
      { name: 'Stomach Care', img: 'https://onemg.gumlet.io/a_ignore,w_150,h_150,c_fit,q_auto,f_auto/702457a8-ff7d-43a6-bd1d-6bcb278ce686.png' },
      { name: 'Liver Care', img: 'https://onemg.gumlet.io/a_ignore,w_150,h_150,c_fit,q_auto,f_auto/baa97676-e0f3-4cb7-adc8-422ce4afda4b.png' },
      { name: 'Bone, Joint', img: 'https://onemg.gumlet.io/a_ignore,w_150,h_150,c_fit,q_auto,f_auto/a54b3586-eac3-4a1e-abf6-7b2ced201460.png' },
      { name: 'Kidney Care', img: 'https://onemg.gumlet.io/a_ignore,w_150,h_150,c_fit,q_auto,f_auto/f44053e1-e630-4e35-ae23-1440d9df8bc4.png' }
   ];

   return (
      <div className="space-y-12 pb-12">
         {/* Hero Section with 3D */}
         <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white min-h-[500px] flex items-center shadow-2xl">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 opacity-30">
               <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-brand-500 rounded-full blur-[120px] animate-pulse"></div>
               <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-emerald-500 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
               <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
               >
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-brand-300 text-sm font-bold uppercase tracking-widest">
                     <Activity size={16} /> Empowering Your Health
                  </div>
                  <h2 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight">
                     Modern Care, <br />
                     <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-400 to-emerald-400">
                        Delivered Fast.
                     </span>
                  </h2>
                  <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
                     Experience the ultimate pharmacy service within 3km of the hospital.
                     Genuine medicines, expert advice, and lightning-fast delivery at your fingertips.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                     <Link to="/medicines" className="group bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-brand-500/20 transition-all flex items-center gap-2">
                        Order Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                     </Link>
                     <Link to="/prescriptions" className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-bold py-4 px-10 rounded-2xl border border-white/20 transition-all">
                        Upload Prescription
                     </Link>
                  </div>
               </motion.div>

               <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="hidden lg:block relative"
               >
                  <ThreeScene />
                  {/* Floating elements overlay */}
                  <div className="absolute top-10 right-10 glass-card p-4 rounded-2xl animate-bounce">
                     <Zap className="text-brand-500" />
                  </div>
               </motion.div>
            </div>
         </div>

         {/* Trust Markers */}
         <div className="bg-white py-6 px-8 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <ShieldCheck size={32} className="text-brand-500" />
               <div>
                  <h4 className="font-bold text-gray-900">100% Genuine Medicines</h4>
                  <p className="text-xs text-gray-500">Sourced directly from manufacturers</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <RefreshCw size={32} className="text-brand-500" />
               <div>
                  <h4 className="font-bold text-gray-900">Easy Returns</h4>
                  <p className="text-xs text-gray-500">Hassle-free return policy</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <PhoneCall size={32} className="text-brand-500" />
               <div>
                  <h4 className="font-bold text-gray-900">Expert Pharmacists</h4>
                  <p className="text-xs text-gray-500">Validating all your prescriptions</p>
               </div>
            </div>
         </div>

         {/* Shop By Health Concerns */}
         <section>
            <div className="flex justify-between items-end mb-6">
               <h3 className="text-2xl font-bold text-gray-900">Shop by Health Concerns</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
               {healthConcerns.map((concern, idx) => (
                  <Link key={idx} to="/medicines" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-brand-300 hover:shadow-md transition-all text-center flex flex-col items-center gap-3">
                     <div className="h-20 w-20 bg-gray-50 rounded-full p-2 flex items-center justify-center">
                        <img src={concern.img} alt={concern.name} className="max-w-full mix-blend-multiply" />
                     </div>
                     <span className="font-semibold text-gray-700 text-sm">{concern.name}</span>
                  </Link>
               ))}
            </div>
         </section>

         {/* Trending Products */}
         <section>
            <div className="flex justify-between items-end mb-6">
               <h3 className="text-2xl font-bold text-gray-900">Trending Near You</h3>
               <Link to="/medicines" className="bg-brand-50 text-brand-600 px-4 py-2 font-bold rounded-lg hover:bg-brand-100 transition-colors">See All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {featuredMedicines.map((product) => (
                  <ProductCard key={product.id} product={product} />
               ))}
            </div>
         </section>

         {/* Banner ad */}
         <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg relative h-48 flex items-center px-12">
            <div className="z-10 relative text-white">
               <h3 className="text-3xl font-extrabold mb-2">Comprehensive Lab Tests</h3>
               <p className="text-gray-300 mb-4 max-w-lg">Get full body checkups and advanced diagnostics mapped straight to our hospital labs.</p>
               <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  Book Test Now
               </button>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-brand-500 opacity-20 transform -skew-x-12 translate-x-12"></div>
         </div>
      </div>
   );
};

export default Home;
