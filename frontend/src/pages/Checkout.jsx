import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { fetchCart } from '../store/cartSlice';
import { openAuthModal } from '../store/authSlice';
import { MapPin, CreditCard, DollarSign, CheckCircle } from 'lucide-react';

const Checkout = () => {
   const { items, totalPrice } = useSelector(state => state.cart);
   const { isAuthenticated } = useSelector(state => state.auth);
   
   const [addresses, setAddresses] = useState([]);
   const [selectedAddress, setSelectedAddress] = useState(null);
   const [paymentMethod, setPaymentMethod] = useState('cod');
   const [isProcessing, setIsProcessing] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState(false);

   const dispatch = useDispatch();
   const navigate = useNavigate();

   useEffect(() => {
      if (!isAuthenticated) {
         navigate('/');
         dispatch(openAuthModal());
         return;
      }
      if (items.length === 0) return navigate('/cart');

      const fetchAddresses = async () => {
         try {
            const res = await api.get('users/addresses/');
            setAddresses(res.data);
            if (res.data.length > 0) {
               setSelectedAddress(res.data[0].id);
            }
         } catch (err) {
            console.error(err);
         }
      };

      fetchAddresses();
   }, [isAuthenticated, items, navigate, dispatch]);

   const handlePlaceOrder = async () => {
      if (!selectedAddress) {
         setError("Please select a delivery address");
         return;
      }

      setIsProcessing(true);
      setError('');

      try {
         // Create the order payload
         const orderData = {
            delivery_address: selectedAddress,
            // prescription: null // Need logic to map uploaded prescription ID, for now we will rely on Cart checks or bypass if mock
         };

         await api.post('orders/orders/', orderData);
         
         // Clear cart logic happens on backend upon order creation
         dispatch(fetchCart()); 
         setSuccess(true);
         
         setTimeout(() => {
            navigate('/profile');
         }, 3000);

      } catch (err) {
         if (err.response && err.response.data) {
            // Display backend validation error (e.g. Geofence failed, Prescription missing)
            const errorKeys = Object.keys(err.response.data);
            setError(err.response.data[errorKeys[0]] || "Order failed. Please check criteria.");
         } else {
            setError("Network error occurred while placing order.");
         }
      } finally {
         setIsProcessing(false);
      }
   };

   if (success) {
      return (
         <div className="py-20 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 min-h-125">
            <CheckCircle className="text-green-500 h-24 w-24 mb-6" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Order Placed Successfully!</h2>
            <p className="text-gray-500 text-lg">Thank you for shopping with HealthMeds. Your medicines are on the way.</p>
            <p className="text-gray-400 mt-2">Redirecting to your orders...</p>
         </div>
      );
   }

   return (
      <div className="flex flex-col lg:flex-row gap-8">
         <div className="flex-1 space-y-6">
            
            {/* Delivery Address Secton */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-brand-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">1</span> 
                  Select Delivery Address
               </h3>
               
               {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm font-medium border border-red-200">{error}</div>}

               {addresses.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-200">
                     No saved addresses found. 
                     <Link to="/profile" className="text-brand-600 font-bold ml-2">Add new address</Link>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {addresses.map(addr => (
                        <label key={addr.id} className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-brand-300'}`}>
                           <input type="radio" className="mt-1 text-brand-500 focus:ring-brand-500" 
                              checked={selectedAddress === addr.id}
                              onChange={() => setSelectedAddress(addr.id)}
                           />
                           <div>
                              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                 {addr.is_default && <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider">Default</span>}
                                 {addr.street_address}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{addr.city}, {addr.state} - {addr.postal_code}</p>
                           </div>
                        </label>
                     ))}
                  </div>
               )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-brand-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">2</span> 
                  Select Payment Method
               </h3>
               
               <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                     <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-brand-500" />
                     <DollarSign className="text-brand-600" size={24}/>
                     <span className="font-bold text-gray-900">Cash on Delivery (COD)</span>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                     <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="text-brand-500" />
                     <CreditCard className="text-gray-600" size={24}/>
                     <div>
                        <span className="font-bold text-gray-900 block">Credit / Debit Card</span>
                        <span className="text-xs text-gray-500">Not functional in MVP.</span>
                     </div>
                  </label>
               </div>
            </div>

         </div>

         <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
               <h3 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Order Summary</h3>
               
               <div className="space-y-3 text-sm flex flex-col mb-4">
                  {items.map(item => (
                     <div key={item.id} className="flex justify-between items-start border-b border-gray-50 pb-2">
                        <span className="text-gray-600 line-clamp-1 flex-1 pr-2">{item.quantity}x {item.product_details.name}</span>
                        <span className="font-medium">₹{(item.product_details.discount_price || item.product_details.price) * item.quantity}</span>
                     </div>
                  ))}
               </div>

               <div className="space-y-2 text-sm text-gray-600 mb-6">
                 <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{totalPrice}</span>
                 </div>
                 <div className="flex justify-between text-green-600">
                    <span>Delivery Charges</span>
                    <span className="font-medium">Free</span>
                 </div>
               </div>

               <div className="pt-4 border-t flex justify-between items-center mb-6">
                 <span className="font-bold text-gray-900">Total Amount</span>
                 <span className="font-extrabold text-xl text-gray-900">₹{totalPrice}</span>
               </div>

               <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className={`w-full font-bold py-3.5 rounded-lg shadow-sm transition-colors text-white ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600'}`}
               >
                  {isProcessing ? 'Processing...' : 'Place Order securely'}
               </button>
            </div>
         </div>
      </div>
   );
};

export default Checkout;
