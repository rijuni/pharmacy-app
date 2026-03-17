import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Heart, Activity, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { addToCart } from '../store/cartSlice';
import api from '../api/axios';

const ProductDetails = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const dispatch = useDispatch();
   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchProduct = async () => {
         try {
            // Using list endpoint with search/filter since DRF might not have configured detail endpoint exactly this way, 
            // but assuming a standard ViewSet it's /products/products/{id}/
            const response = await api.get(`products/products/${id}/`);
            setProduct(response.data);
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchProduct();
   }, [id]);

   const handleAdd = () => {
      if(product) {
         dispatch(addToCart({ productId: product.id, quantity: 1 }));
         // Optionally navigate to cart or show a toast
         navigate('/cart');
      }
   };

   const getImageUrl = (imagePath) => {
      if (!imagePath) return "https://via.placeholder.com/300?text=Image+Unavailable";
      if (imagePath.startsWith('http')) return imagePath;
      return `http://localhost:8000${imagePath}`;
   };

   if (loading) return <div className="py-20 text-center">Loading product details...</div>;
   if (!product) return <div className="py-20 text-center">Product not found.</div>;

   return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Galery */}
            <div className="relative border border-gray-100 rounded-xl p-8 flex items-center justify-center bg-gray-50 h-100">
               {product.requires_prescription && (
                 <span className="absolute top-4 left-4 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded border border-red-200 shadow-sm flex items-center gap-1">
                    <AlertTriangle size={14} /> Prescription Required
                 </span>
               )}
               {!product.is_available && (
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                    <span className="bg-red-600 text-white text-lg font-black px-6 py-3 rounded-full">OUT OF STOCK</span>
                 </div>
               )}
               <button className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:text-red-500 text-gray-400">
                  <Heart size={20} />
               </button>
               <img src={getImageUrl(product.image)} alt={product.name} className={`max-h-full max-w-full object-contain mix-blend-multiply ${!product.is_available && 'opacity-60'}`} />
            </div>

            {/* Product Meta */}
            <div className="flex flex-col">
               <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
               <p className="text-brand-600 font-semibold mb-4 text-sm flex items-center gap-2">
                  <Activity size={16} /> Generic name: {product.generic_name || 'Not Available'}
               </p>

               <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 mb-6 flex justify-between items-center">
                  <div>
                     {product.discount_price ? (
                        <div className="flex items-center gap-3">
                           <span className="text-3xl font-extrabold text-gray-900">₹{product.discount_price}</span>
                           <span className="text-lg text-gray-400 line-through">₹{product.price}</span>
                           <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                              {Math.round(((product.price - product.discount_price) / product.price) * 100)}% off
                           </span>
                        </div>
                     ) : (
                        <span className="text-3xl font-extrabold text-gray-900">₹{product.price}</span>
                     )}
                     <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                  </div>

                  <button 
                    onClick={handleAdd}
                    disabled={!product.is_available}
                    className={`font-bold py-3 px-8 rounded-lg shadow-sm transition-transform transform ${
                      product.is_available
                        ? 'bg-brand-500 hover:bg-brand-600 text-white hover:-translate-y-0.5 cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                     {product.is_available ? 'Add to Cart' : 'Out of Stock'}
                  </button>
               </div>

               <div className="space-y-4 text-sm text-gray-700 grow">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Description</h3>
                  <p className="whitespace-pre-line leading-relaxed">{product.description || "No description provided."}</p>
                  
                  <div className="pt-4 flex flex-col gap-3">
                     <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle size={18} className="text-green-500"/> Validated by Expert Pharmacist
                     </div>
                     <div className="flex items-center gap-2 text-gray-600">
                        <Shield size={18} className="text-blue-500"/> 100% Genuine product guaranteed
                     </div>
                  </div>

                  <div className="pt-4 border-t">
                     <h4 className="font-bold text-gray-900 mb-2">Availability</h4>
                     <div className={`p-3 rounded-lg ${product.is_available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`font-bold ${product.is_available ? 'text-green-700' : 'text-red-700'}`}>
                           {product.is_available ? '✓ In Stock' : '✗ Out of Stock'}
                        </p>
                        {product.stock > 0 && <p className="text-xs text-gray-600 mt-1">{product.stock} units available</p>}
                     </div>
                  </div>

                  {product.manufacturer && (
                     <div className="pt-4 border-t">
                        <h4 className="font-bold text-gray-900 mb-1">Manufacturer</h4>
                        <p className="text-gray-600">{product.manufacturer}</p>
                     </div>
                  )}

                  {product.strength && (
                     <div className="pt-2">
                        <h4 className="font-bold text-gray-900 mb-1">Strength</h4>
                        <p className="text-gray-600">{product.strength}</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Substitutes Section */}
         {product.substitutes && product.substitutes.length > 0 && (
            <div className="mt-12 pt-12 border-t">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cheaper Alternatives</h2>
                  <span className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-bold">Same Salt Composition</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {product.substitutes.map(sub => (
                     <div key={sub.id} onClick={() => navigate(`/product/${sub.id}`)} className="cursor-pointer group flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 transition-all">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                           <img src={getImageUrl(sub.image)} alt={sub.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">{sub.name}</h4>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{sub.manufacturer}</p>
                           <div className="flex items-center justify-between mt-2">
                              <span className="font-black text-gray-900">₹{sub.price}</span>
                              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">
                                 {sub.price < product.price ? `${Math.round(((product.price - sub.price) / product.price) * 100)}% Cheaper` : 'Alternative'}
                              </span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Medical Information Section */}
         <div className="mt-12 pt-12 border-t">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-2 space-y-10">
                  <div>
                     <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        <Activity size={24} className="text-brand-500" /> Medicine Overview
                     </h3>
                     <div className="glass-card p-6 rounded-2xl border border-gray-100 bg-gray-50/30">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Salt Composition</h4>
                        <p className="text-lg font-bold text-slate-800">{product.salt_composition || 'Information not available'}</p>
                     </div>
                  </div>

                  {product.how_to_use && (
                     <div>
                        <h3 className="text-xl font-black text-gray-900 mb-4">How to Use</h3>
                        <p className="text-gray-600 leading-relaxed bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                           <CheckCircle className="text-blue-500 mt-1 shrink-0" size={20} />
                           {product.how_to_use}
                         </p>
                      </div>
                   )}

                   {product.side_effects && (
                      <div>
                         <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle size={24} className="text-rose-500" /> Common Side Effects
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.side_effects.split(',').map((effect, idx) => (
                               <div key={idx} className="flex items-center gap-3 p-4 bg-rose-50/30 rounded-xl border border-rose-100/50 text-rose-900 text-sm font-semibold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                  {effect.strip ? effect.trim() : effect}
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>

                <div className="space-y-8">
                   {product.expert_tips && (
                      <div className="bg-brand-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-brand-500/20 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                         <h3 className="text-lg font-black mb-4 flex items-center gap-2 relative z-10">
                            <Shield size={20} /> Expert Tips
                         </h3>
                         <p className="text-sm text-brand-50 font-medium leading-relaxed relative z-10">
                            {product.expert_tips}
                         </p>
                      </div>
                   )}

                   {product.interactions && (
                      <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl">
                         <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-amber-400">
                            <AlertTriangle size={20} /> Safety Warning
                         </h3>
                         <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            {product.interactions}
                         </p>
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
   );
};

export default ProductDetails;
