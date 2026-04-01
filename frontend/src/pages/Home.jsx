import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, PhoneCall, ArrowRight, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ThreeScene from '../components/ThreeScene';
import api from '../api/axios';

const Home = () => {
   const [featuredMedicines, setFeaturedMedicines] = useState([]);
   const [categories, setCategories] = useState([]);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [catRes, prodRes] = await Promise.all([
               api.get('products/categories/'),
               api.get('products/products/?limit=4')
            ]);
            
            const catData = catRes.data.results || catRes.data;
            setCategories(Array.isArray(catData) ? catData : []);

            const prodData = prodRes.data.results || prodRes.data;
            setFeaturedMedicines(Array.isArray(prodData) ? prodData.slice(0, 4) : []);
         } catch (err) {
            console.error("Failed to fetch home data", err);
         }
      };

      fetchData();
   }, []);


   const getImageUrl = (imagePath) => {
      if (!imagePath) return "https://via.placeholder.com/150?text=Health";
      if (imagePath.startsWith('http')) return imagePath;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      return `${backendUrl}${imagePath}`;
   };

   const getCategoryIcon = (name) => {
      const n = name.toLowerCase();
      if (n.includes('pain')) return <Activity className="text-rose-500" />;
      if (n.includes('antibiotic')) return <Zap className="text-amber-500" />;
      if (n.includes('cold') || n.includes('cough')) return <Activity className="text-blue-500" />;
      if (n.includes('digest')) return <Activity className="text-emerald-500" />;
      if (n.includes('heart')) return <Activity className="text-red-500" />;
      if (n.includes('diabetes')) return <Activity className="text-orange-500" />;
      if (n.includes('vitamin')) return <Zap className="text-yellow-500" />;
      if (n.includes('skin')) return <Activity className="text-pink-500" />;
      return <Activity className="text-brand-500" />;
   };

   return (
      <div className="space-y-12 pb-12">
         {/* Hero Section with 3D */}
         <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white min-h-125 flex items-center shadow-2xl">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
               {categories.map((cat) => (
                  <Link key={cat.id} to={`/medicines?category=${cat.id}`} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/5 transition-all text-center flex flex-col items-center gap-4 group">
                     <div className="h-20 w-20 bg-slate-50 group-hover:bg-brand-50 rounded-full flex items-center justify-center overflow-hidden transition-colors">
                        {cat.image ? (
                           <img src={getImageUrl(cat.image)} alt={cat.name} className="max-w-[70%] h-full object-contain mix-blend-multiply" />
                        ) : (
                           <div className="scale-150">
                              {getCategoryIcon(cat.name)}
                           </div>
                        )}
                     </div>
                     <span className="font-bold text-slate-700 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">{cat.name}</span>
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
               <Link to="/medicines?category=Lab%20Tests" className="inline-block bg-white text-gray-900 px-6 py-2 rounded-lg font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  Book Test Now
               </Link>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-brand-500 opacity-20 transform -skew-x-12 translate-x-12"></div>
         </div>
      </div>
   );
};

export default Home;
