import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, addToCart } from '../store/cartSlice';
import { Trash2, Plus, Minus, FileText, ShoppingCart } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { openAuthModal } from '../store/authSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, status } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handleUpdateQuantity = async (productId, quantityToAdd) => {
    if (quantityToAdd === 1) {
       dispatch(addToCart({ productId, quantity: 1 }));
    } else {
       await api.post('orders/cart/remove/', { product_id: productId });
       dispatch(fetchCart()); // Refresh
    }
  };

  const handleRemoveItem = async (productId) => {
    await api.post('orders/cart/remove/', { product_id: productId });
    dispatch(fetchCart());
  };

  const getImageUrl = (imagePath) => {
     if (!imagePath) return "https://via.placeholder.com/60?text=No+Img";
     if (imagePath.startsWith('http')) return imagePath;
     const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
     return `${backendUrl}${imagePath}`;
  };

  if (!isAuthenticated) {
     return (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
           <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
           <h2 className="text-2xl font-bold text-gray-700 mb-2">Please log in to view your cart</h2>
           <button onClick={() => dispatch(openAuthModal())} className="bg-brand-500 text-white px-6 py-2 rounded-lg font-bold mt-4 shadow-sm hover:bg-brand-600 transition-colors">Go to Login</button>
        </div>
     );
  }

  const requiresRx = items.some(item => item.product.requires_prescription);

  if (status === 'loading') {
     return (
        <div className="py-20 flex justify-center items-center">
           <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Cart Items */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({items.length} items)</h2>
        
        {items.length === 0 ? (
           <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
             <p className="text-gray-500">Your cart is currently empty.</p>
             <button onClick={() => navigate('/medicines')} className="text-brand-600 font-bold mt-4 hover:underline">Add some medicines</button>
           </div>
        ) : (
           <div className="space-y-4">
             {items.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                   <img src={getImageUrl(item.product.image)} alt={item.product.name} className="w-20 h-20 object-contain bg-gray-50 rounded p-1"/>
                   
                   <div className="flex-1">
                     <h4 className="font-bold text-gray-800 line-clamp-1">{item.product.name}</h4>
                     <p className="text-sm text-gray-500">{item.product.generic_name}</p>
                     {item.product.requires_prescription && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded mt-1 inline-block">Rx Required</span>
                     )}
                   </div>

                   <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button onClick={() => handleUpdateQuantity(item.product.id, -1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100"> - </button>
                        <span className="px-3 font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.product.id, 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-brand-600 font-bold"> + </button>
                      </div>
                   </div>

                   <div className="text-right min-w-20">
                      <div className="font-bold text-gray-900">
                         ₹{item.product.discount_price ? item.product.discount_price * item.quantity : item.product.price * item.quantity}
                      </div>
                      <button onClick={() => handleRemoveItem(item.product.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold mt-2 flex items-center justify-end gap-1 w-full">
                         <Trash2 size={12}/> Remove
                      </button>
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>

      {/* Checkout Sidebar */}
      {items.length > 0 && (
         <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
               <h3 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Order Summary</h3>
               
               <div className="space-y-3 text-sm text-gray-600 mb-6">
                 <div className="flex justify-between">
                    <span>Cart Value</span>
                    <span className="font-medium">₹{totalPrice}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Delivery Charges (within 3km)</span>
                    <span className="text-green-600 font-medium">FREE</span>
                 </div>
                 
                 {requiresRx && (
                   <div className="bg-orange-50 border border-orange-100 p-3 rounded flex gap-3 items-start mt-4 text-orange-800">
                      <FileText size={18} className="shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <strong>Prescription Required</strong>
                        <p className="mt-1">You must upload a valid Rx on the checkout page.</p>
                      </div>
                   </div>
                 )}
               </div>

               <div className="pt-4 border-t flex justify-between items-center mb-6">
                 <span className="font-bold text-gray-900">Total</span>
                 <span className="font-extrabold text-xl text-gray-900">₹{totalPrice}</span>
               </div>

               <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-lg shadow-sm transition-colors"
               >
                  Proceed to Checkout
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default Cart;
