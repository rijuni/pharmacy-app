import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Heart, Activity, CheckCircle, Shield, AlertTriangle, Star, User, MessageSquare, Send } from 'lucide-react';
import { addToCart } from '../store/cartSlice';
import api from '../api/axios';

const ProductDetails = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const dispatch = useDispatch();
   const { isAuthenticated } = useSelector(state => state.auth);
   
   const [product, setProduct] = useState(null);
   const [loading, setLoading] = useState(true);
   const [reviewRating, setReviewRating] = useState(5);
   const [reviewComment, setReviewComment] = useState('');
   const [submittingReview, setSubmittingReview] = useState(false);

   useEffect(() => {
      fetchProduct();
   }, [id]);

   const fetchProduct = async () => {
      try {
         const response = await api.get(`products/products/${id}/`);
         setProduct(response.data);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const handleAdd = () => {
      if(product) {
         dispatch(addToCart({ productId: product.id, quantity: 1 }));
         navigate('/cart');
      }
   };

   const handleReviewSubmit = async (e) => {
      e.preventDefault();
      if (!isAuthenticated) {
         alert("Please login to leave a review");
         return;
      }
      
      setSubmittingReview(true);
      try {
         await api.post('products/reviews/', {
            product: product.id,
            rating: reviewRating,
            comment: reviewComment
         });
         setReviewComment('');
         setReviewRating(5);
         fetchProduct(); // Refresh to show new review
      } catch (err) {
         console.error(err);
         alert(err.response?.data?.non_field_errors?.[0] || "Failed to submit review. You might have already reviewed this product.");
      } finally {
         setSubmittingReview(false);
      }
   };

   const getImageUrl = (imagePath) => {
      if (!imagePath) return "https://via.placeholder.com/300?text=Image+Unavailable";
      if (imagePath.startsWith('http')) return imagePath;
      return `http://localhost:8000${imagePath}`;
   };

   if (loading) return <div className="py-20 text-center text-4xl font-black text-slate-200 animate-pulse italic">PHARMACIST IS FETCHING...</div>;
   if (!product) return <div className="py-20 text-center text-2xl font-black text-rose-500">EXPERIENCE 404: MEDICINE NOT FOUND</div>;

   return (
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
         <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 rounded-full -mr-48 -mt-48 blur-3xl opacity-50"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
               {/* Image Gallery */}
               <div className="relative group bg-slate-50 rounded-[2.5rem] p-12 flex items-center justify-center min-h-[500px] border border-slate-100 transition-all hover:shadow-inner">
                  {product.requires_prescription && (
                    <span className="absolute top-8 left-8 bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-full border border-rose-500 shadow-xl shadow-rose-500/30 flex items-center gap-2 uppercase tracking-widest animate-bounce">
                       <AlertTriangle size={14} /> Rx Required
                    </span>
                  )}
                  {!product.is_available && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center z-20">
                       <span className="bg-slate-900 text-white text-2xl font-black px-10 py-5 rounded-full rotate-[-10deg] shadow-2xl uppercase tracking-tighter italic">Out of Stock</span>
                    </div>
                  )}
                  <button className="absolute top-8 right-8 bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl hover:text-rose-500 text-slate-300 transition-all transform hover:scale-110 active:scale-95">
                     <Heart size={24} />
                  </button>
                  <img 
                     src={getImageUrl(product.image)} 
                     alt={product.name} 
                     className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110 ${!product.is_available && 'grayscale opacity-30'}`} 
                  />
               </div>

               {/* Product Meta */}
               <div className="flex flex-col">
                  <div className="mb-8">
                     <p className="text-brand-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                        <Activity size={16} /> GENERIC: {product.generic_name || 'Pharmacopoeia Grade'}
                     </p>
                     <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">{product.name}</h1>
                     
                     <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                           {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < Math.round(product.average_rating) ? "fill-amber-400 text-amber-400" : "text-amber-200"} />
                           ))}
                           <span className="text-xs font-black text-amber-700 ml-1">{product.average_rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.reviews?.length || 0} Verified Reviews</span>
                     </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                     <div className="relative z-10">
                        <div className="flex items-baseline gap-4">
                           <span className="text-5xl font-black tracking-tighter">₹{product.price}</span>
                           <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Net Price</span>
                        </div>
                        <p className="text-[10px] text-brand-400 font-black uppercase tracking-widest mt-2 flex items-center gap-1 italic">
                           <Shield size={12} /> Insurance Covered & Tax Included
                        </p>
                     </div>

                     <button 
                        onClick={handleAdd}
                        disabled={!product.is_available}
                        className={`relative z-10 w-full md:w-auto font-black px-12 py-5 rounded-2xl transition-all transform active:scale-95 text-sm uppercase tracking-widest ${
                        product.is_available
                           ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/40 hover:-translate-y-1'
                           : 'bg-slate-700 text-slate-500 cursor-not-allowed grayscale'
                        }`}
                     >
                        {product.is_available ? 'Add to Prescription Bag' : 'Out of Stock'}
                     </button>
                  </div>

                  <div className="space-y-8 text-sm text-slate-700 grow">
                     <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Manufacturer Insights</h3>
                        <div className="flex flex-wrap gap-4">
                           <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                              <Shield size={16} className="text-brand-500" />
                              <span className="font-bold">{product.manufacturer || 'Global Pharma'}</span>
                           </div>
                           <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                              <Activity size={16} className="text-brand-500" />
                              <span className="font-bold">{product.strength || 'Standard Dose'}</span>
                           </div>
                           <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                              <Package size={16} className="text-brand-500" />
                              <span className="font-bold">{product.form || 'Tablet'}</span>
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 italic">Clinical Description</h3>
                        <p className="text-base text-slate-600 leading-relaxed font-medium line-clamp-4 hover:line-clamp-none transition-all duration-500 cursor-help">
                           {product.description || "Comprehensive pharmacological data pending clinical review. This medication meets all international quality standards for purity and potency."}
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Medical Data Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               {/* Substance Analysis */}
               <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-100 border border-slate-50">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="p-4 bg-brand-50 rounded-2xl text-brand-600">
                        <Activity size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Components</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Chemical Composition Analysis</p>
                     </div>
                  </div>
                  
                  <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 group hover:border-brand-200 transition-colors">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Principal Salt</span>
                     <p className="text-2xl font-black text-slate-800 tracking-tighter group-hover:text-brand-600 transition-colors">{product.salt_composition || 'Purified Therapeutic Grade'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     {product.how_to_use && (
                        <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                           <h4 className="flex items-center gap-2 font-black text-blue-900 uppercase text-xs tracking-widest mb-4">
                              <CheckCircle size={16} /> Administration
                           </h4>
                           <p className="text-sm text-blue-800/80 font-medium leading-relaxed">{product.how_to_use}</p>
                        </div>
                     )}
                     {product.side_effects && (
                        <div className="p-6 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                           <h4 className="flex items-center gap-2 font-black text-rose-900 uppercase text-xs tracking-widest mb-4">
                              <AlertTriangle size={16} /> Side Effects
                           </h4>
                           <div className="flex flex-wrap gap-2">
                              {product.side_effects.split(',').map((e, i) => (
                                 <span key={i} className="text-[10px] font-black bg-white px-3 py-1 rounded-full text-rose-600 border border-rose-100">{e.trim()}</span>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* Substitutes */}
               {product.substitutes && product.substitutes.length > 0 && (
                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                     <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-500 rounded-full -mb-32 -mr-32 blur-[100px] opacity-20"></div>
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <h2 className="text-3xl font-black tracking-tighter italic">Bio-Equivalent Alternatives</h2>
                        <span className="bg-white/10 backdrop-blur-md text-brand-400 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">Economy Optimized</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {product.substitutes.map(sub => (
                           <div key={sub.id} onClick={() => navigate(`/product/${sub.id}`)} className="cursor-pointer group bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 transition-all hover:scale-[1.02]">
                              <div className="flex items-center gap-4">
                                 <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={getImageUrl(sub.image)} className="max-h-full max-w-full object-contain" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-white truncate text-sm uppercase tracking-tight">{sub.name}</h4>
                                    <div className="flex items-center justify-between mt-2">
                                       <span className="font-black text-brand-400">₹{sub.price}</span>
                                       <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black italic">
                                          {sub.price < product.price ? `Save ${Math.round(((product.price - sub.price) / product.price) * 100)}%` : 'Available'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Reviews Section */}
               <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-100 border border-slate-50">
                  <div className="flex items-center justify-between mb-10">
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Vocal Patients</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-world health experiences</p>
                     </div>
                     <div className="flex flex-col items-end">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{product.average_rating.toFixed(1)}</div>
                        <div className="flex text-amber-400 gap-0.5">
                           {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.round(product.average_rating) ? "fill-current" : "text-slate-200"} />)}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8 divide-y divide-slate-50">
                     {product.reviews && product.reviews.length > 0 ? (
                        product.reviews.map(review => (
                           <div key={review.id} className="pt-8 first:pt-0">
                              <div className="flex items-center gap-3 mb-4">
                                 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                 </div>
                                 <div>
                                    <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">{review.username}</h5>
                                    <div className="flex text-amber-400 gap-0.5 mt-0.5">
                                       {[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < review.rating ? "fill-current" : "text-slate-200"} />)}
                                    </div>
                                 </div>
                                 <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-6 ml-5">
                                 "{review.comment}"
                              </p>
                           </div>
                        ))
                     ) : (
                        <div className="py-10 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic border-2 border-dashed border-slate-50 rounded-2xl">
                           Be the first to share your health journey
                        </div>
                     )}
                  </div>

                  {/* Add Review Form */}
                  {isAuthenticated && (
                     <div className="mt-12 pt-12 border-t-2 border-slate-50">
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                           <MessageSquare size={16} className="text-brand-500" /> Document your experience
                        </h4>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                           <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate Efficiency</span>
                              <div className="flex gap-2">
                                 {[1, 2, 3, 4, 5].map(num => (
                                    <button 
                                       key={num} 
                                       type="button" 
                                       onClick={() => setReviewRating(num)}
                                       className={`w-10 h-10 rounded-xl font-black transition-all transform active:scale-90 ${reviewRating === num ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-white text-slate-400 border border-slate-100 hover:border-brand-200'}`}
                                    >
                                       {num}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <div className="relative">
                              <textarea 
                                 value={reviewComment}
                                 onChange={(e) => setReviewComment(e.target.value)}
                                 placeholder="Was this effective for you? Any insights for other patients..."
                                 className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all min-h-[120px] placeholder:italic placeholder:text-slate-300"
                                 required
                              ></textarea>
                              <button 
                                 type="submit" 
                                 disabled={submittingReview}
                                 className="absolute bottom-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:bg-brand-600 transition-all transform active:scale-95 disabled:grayscale"
                              >
                                 {submittingReview ? <Activity className="animate-spin" size={20} /> : <Send size={20} />}
                              </button>
                           </div>
                        </form>
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-8">
               {/* Pharmacist Verification */}
               <div className="p-8 bg-emerald-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full -mr-16 -mt-16 blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <CheckCircle size={48} className="text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                  <h3 className="text-xl font-black mb-4 tracking-tighter uppercase italic">Quality Assured</h3>
                  <div className="space-y-4">
                     <div className="flex items-start gap-3">
                        <Shield size={18} className="text-emerald-400 shrink-0 mt-1" />
                        <p className="text-xs text-emerald-100/70 font-medium leading-relaxed">Certified by the Board of Pharmacy for therapeutic equivalence.</p>
                     </div>
                     <div className="flex items-start gap-3">
                        <Activity size={18} className="text-emerald-400 shrink-0 mt-1" />
                        <p className="text-xs text-emerald-100/70 font-medium leading-relaxed">Batch tested for purity and chemical consistency in ISO-certified labs.</p>
                     </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Authentic Seal</span>
                     <div className="text-xs font-black italic tracking-tighter">HMS-PX-VERIFIED</div>
                  </div>
               </div>

               {product.expert_tips && (
                  <div className="bg-brand-600 text-white p-8 rounded-[3rem] shadow-xl shadow-brand-500/20 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                     <h3 className="text-lg font-black mb-6 flex items-center gap-2 relative z-10 italic">
                        <Shield size={20} className="text-brand-200" /> Pharmacist's Note
                     </h3>
                     <p className="text-sm text-brand-50 font-medium leading-relaxed relative z-10 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                        {product.expert_tips}
                     </p>
                  </div>
               )}

               {product.interactions && (
                  <div className="p-8 bg-slate-100 rounded-[3rem] border border-slate-200 group">
                     <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-rose-600 uppercase tracking-tighter italic">
                        <AlertTriangle size={20} /> Precautions
                     </h3>
                     <p className="text-sm text-slate-500 font-bold leading-relaxed">
                        {product.interactions}
                     </p>
                     <p className="mt-6 text-[10px] text-slate-400 font-black uppercase tracking-widest leading-loose">
                        Always consult with your physician before combining with other clinical prescriptions.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ProductDetails;

