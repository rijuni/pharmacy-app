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
               <button className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:text-red-500 text-gray-400">
                  <Heart size={20} />
               </button>
               <img src={getImageUrl(product.image)} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
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
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-transform transform hover:-translate-y-0.5"
                  >
                     Add to Cart
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
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProductDetails;
