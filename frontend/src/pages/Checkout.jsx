import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import api from '../api/axios';
import { fetchCart } from '../store/cartSlice';
import { openAuthModal } from '../store/authSlice';
import { MapPin, CreditCard, DollarSign, CheckCircle, AlertCircle, Plus, X, Truck, Minus, Trash2 } from 'lucide-react';
import StripePaymentForm from '../components/StripePaymentForm';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutContent = () => {
    const { user } = useSelector(state => state.auth);
    const { items, totalPrice } = useSelector(state => state.cart);
    const { isAuthenticated } = useSelector(state => state.auth);
    
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [prescriptionWarning, setPrescriptionWarning] = useState('');
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showStripePayment, setShowStripePayment] = useState(false);
    
    // Address Form State
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '', city: '', state: '', zip_code: '', is_default: false
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const fetchAddresses = async () => {
        try {
            const res = await api.get('users/addresses/');
            // API returns paginated response, extract results array
            const addressList = res.data.results || res.data || [];
            setAddresses(Array.isArray(addressList) ? addressList : []);
            if (addressList.length > 0 && !selectedAddress) {
                setSelectedAddress(addressList[0].id);
            }
        } catch (err) {
            console.error(err);
            setAddresses([]);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            dispatch(openAuthModal());
            return;
        }
        if (items.length === 0 && !success) return navigate('/cart');

        // Check for Rx medicines
        const hasRxMedicines = items.some(item => item.product.requires_prescription);
        if (hasRxMedicines) {
            setPrescriptionWarning('This order contains prescription medicines. Verification by a pharmacist is required.');
        }

        fetchAddresses();

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [isAuthenticated, items, navigate, dispatch, success]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('users/addresses/', newAddress);
            setAddresses([...addresses, res.data]);
            setSelectedAddress(res.data.id);
            setShowAddressForm(false);
            setNewAddress({ street: '', city: '', state: '', zip_code: '', is_default: false });
        } catch (err) {
            setError("Failed to add address");
        }
    };

    const handleRazorpayPayment = async () => {
        if (!selectedAddress) {
            setError("Please select a delivery address");
            return;
        }

        if (!razorpayLoaded) {
            setError("Razorpay SDK failed to load. Please check your connection.");
            return;
        }

        // Show confirmation step instead of directly processing
        setShowConfirmation(true);
    };

    const processRazorpayPayment = async () => {
        setIsProcessing(true);
        setError('');

        try {
            // 1. Create order on server to get razorpay_order_id
            const orderRes = await api.post('orders/payment/razorpay-order/');
            const { order_id, amount, currency, key_id } = orderRes.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: "HealthMeds Pharmacy",
                description: "Purchase of medications",
                order_id: order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify payment signature on server
                        await api.post('orders/payment/verify-razorpay/', {
                            razorpay_order_id: order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        // 4. Place actual order in DB
                        // Pass skipProcessing=true so handlePlaceOrder doesn't toggle isProcessing again
                        await handlePlaceOrder(null, {
                            razorpay_order_id: order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }, true);
                    } catch (err) {
                        setError("Payment verification failed. Please contact support.");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: user?.username || "",
                    email: user?.email || "",
                    contact: user?.phone_number || ""
                },
                theme: {
                    color: "#0D9488"
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessing(false);
                        setShowConfirmation(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setError("Failed to initiate Razorpay payment.");
            setIsProcessing(false);
            setShowConfirmation(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (paymentMethod === 'cod') {
            // For COD, directly place order
            await handlePlaceOrder();
            setShowConfirmation(false);
        } else if (paymentMethod === 'razorpay') {
            // For Razorpay, process payment
            setShowConfirmation(false);
            await processRazorpayPayment();
        } else if (paymentMethod === 'card') {
            // For Stripe, show payment form in modal
            setShowStripePayment(true);
        }
    };

    const handleUpdateQuantity = async (productId, newQuantity) => {
        try {
            if (newQuantity === 0) {
                // Remove item
                await api.post('orders/cart/remove/', { product_id: productId });
            } else {
                // Update quantity
                await api.post('orders/cart/add/', { product_id: productId, quantity: 1 });
            }
            dispatch(fetchCart());
        } catch (err) {
            console.error("Failed to update cart:", err);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await api.post('orders/cart/remove/', { product_id: productId });
            dispatch(fetchCart());
        } catch (err) {
            console.error("Failed to remove item:", err);
        }
    };

    const handlePlaceOrder = async (stripePaymentId = null, razorpayData = null, skipProcessing = false) => {
        if (!selectedAddress) {
            setError("Please select a delivery address");
            return;
        }

        // Only toggle isProcessing if we are not already in a Razorpay callback flow
        if (!skipProcessing) {
            setIsProcessing(true);
        }
        setError('');

        try {
            const orderData = {
                address: selectedAddress,
                payment_method: paymentMethod,
            };

            if (stripePaymentId) {
                orderData.payment_intent_id = stripePaymentId;
                orderData.payment_method = 'card';
            }

            if (razorpayData) {
                orderData.razorpay_order_id = razorpayData.razorpay_order_id;
                orderData.razorpay_payment_id = razorpayData.razorpay_payment_id;
                orderData.razorpay_signature = razorpayData.razorpay_signature;
                orderData.payment_method = 'razorpay';
            }

            await api.post('orders/orders/', orderData);
            dispatch(fetchCart());
            setSuccess(true);

            setTimeout(() => {
                navigate('/order-success');
            }, 500);
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.detail || "Order failed. Please check requirements.");
            } else {
                setError("Network error occurred.");
            }
        } finally {
            setIsProcessing(false);
        }
    };


    if (success) {
        return (
            <div className="py-20 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 min-h-125">
                <div className="bg-emerald-50 p-8 rounded-[3rem] mb-6 shadow-2xl shadow-emerald-500/10 border border-emerald-100">
                    <CheckCircle className="text-emerald-500 h-24 w-24" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Order Confirmed!</h2>
                <p className="text-slate-500 text-lg max-w-md">Your health is our priority. We've received your order and are preparing it for delivery.</p>
                <div className="mt-10 flex items-center gap-2 text-brand-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                    <Truck size={18} /> Redirecting to your orders...
                </div>
            </div>
        );
    }

    // Get selected address details
    const selectedAddressDetails = addresses.find(a => a.id === selectedAddress);

    // Confirmation Modal
    if (showConfirmation) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300">
                    {/* Show Stripe Payment Form if in stripe payment step */}
                    {showStripePayment && paymentMethod === 'card' ? (
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Details</h2>
                                <p className="text-slate-500 text-sm mt-2">Complete your payment to confirm the order</p>
                            </div>
                            <StripePaymentForm 
                                amount={totalPrice}
                                isProcessing={isProcessing}
                                onPaymentSuccess={(id) => {
                                    handlePlaceOrder(id);
                                    setShowConfirmation(false);
                                    setShowStripePayment(false);
                                }}
                            />
                            <button
                                onClick={() => {
                                    setShowStripePayment(false);
                                }}
                                className="w-full mt-6 bg-slate-100 text-slate-700 font-black py-3 rounded-2xl uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                            >
                                ← Back to Order Review
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="bg-linear-to-r from-brand-50 to-emerald-50 p-8 border-b border-slate-100 sticky top-0">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Confirm Your Order</h2>
                                <p className="text-slate-500 text-sm mt-2">Please review your order details before proceeding</p>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                {/* Order Items */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <span className="bg-brand-100 text-brand-600 rounded-xl h-8 w-8 flex items-center justify-center text-sm font-black">📦</span>
                                        Order Items
                                    </h3>
                                    <div className="bg-slate-50 rounded-2xl p-6 space-y-3 border border-slate-100">
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center pb-4 border-b border-slate-200 last:border-b-0 last:pb-0 gap-4">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">{item.product.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">₹{item.product.discount_price || item.product.price} x {item.quantity}</p>
                                                </div>
                                                
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                                        className="p-1 hover:bg-red-50 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                                                        title="Decrease quantity"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="px-3 font-bold text-slate-800 min-w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                                        className="p-1 hover:bg-emerald-50 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                                                        title="Increase quantity"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                {/* Price & Delete */}
                                                <div className="flex items-center gap-3">
                                                    <p className="font-black text-slate-900 min-w-16 text-right">₹{(item.product.discount_price || item.product.price) * item.quantity}</p>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.product.id)}
                                                        className="p-2 hover:bg-red-50 rounded-xl text-red-500 hover:text-red-700 transition-colors"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-600 rounded-xl h-8 w-8 flex items-center justify-center text-sm font-black">📍</span>
                                        Delivery Address
                                    </h3>
                                    {selectedAddressDetails && (
                                        <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-100">
                                            <p className="font-bold text-slate-800 text-sm">{selectedAddressDetails.street}</p>
                                            <p className="text-sm text-slate-600 mt-2">{selectedAddressDetails.city}, {selectedAddressDetails.state} {selectedAddressDetails.zip_code}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <span className="bg-purple-100 text-purple-600 rounded-xl h-8 w-8 flex items-center justify-center text-sm font-black">💳</span>
                                        Payment Method
                                    </h3>
                                    <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-100">
                                        <p className="font-bold text-slate-800">
                                            {paymentMethod === 'cod' && '💵 Cash on Delivery'}
                                            {paymentMethod === 'card' && '🏧 Card (Stripe)'}
                                            {paymentMethod === 'razorpay' && '📱 Razorpay (UPI/Cards)'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {paymentMethod === 'cod' && 'Pay at your doorstep'}
                                            {paymentMethod === 'card' && 'Secure payment via Stripe'}
                                            {paymentMethod === 'razorpay' && 'Multiple payment options'}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <div className="bg-linear-to-r from-brand-50 to-emerald-50 rounded-2xl p-6 border-2 border-brand-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black text-slate-900 uppercase tracking-tight">Total Amount</span>
                                        <span className="text-4xl font-black text-brand-600 italic">₹{totalPrice}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-8 border-t border-slate-100">
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className="flex-1 bg-slate-100 text-slate-700 font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                                    >
                                        ← Change Payment Method
                                    </button>
                                    <button
                                        onClick={handleConfirmOrder}
                                        disabled={isProcessing}
                                        className={`flex-1 font-black py-4 rounded-2xl shadow-lg transition-all text-white uppercase tracking-widest text-sm ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95'}`}
                                    >
                                        {isProcessing ? '⏳ Processing...' : '✓ Confirm Order'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">Checkout</h1>
            
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-8">
                    
                    {/* Prescription Warning */}
                    {prescriptionWarning && (
                        <div className="bg-amber-50 border-2 border-amber-100 rounded-4xl p-6 flex gap-4 items-center">
                            <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-amber-900 uppercase tracking-tighter text-sm">Prescription Required</h4>
                                <p className="text-amber-700/80 text-xs font-medium mt-0.5">{prescriptionWarning}</p>
                            </div>
                        </div>
                    )}

                    {/* Delivery Address Section */}
                    <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <span className="bg-brand-500 text-white rounded-2xl h-10 w-10 flex items-center justify-center text-lg shadow-lg shadow-brand-500/30">1</span> 
                                Shipping Details
                            </h3>
                            {!showAddressForm && (
                                <button 
                                    onClick={() => setShowAddressForm(true)}
                                    className="text-brand-600 font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-brand-50 px-4 py-2 rounded-xl transition-all"
                                >
                                    <Plus size={16} /> Add New
                                </button>
                            )}
                        </div>
                        
                        {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl mb-6 text-sm font-bold border-2 border-rose-100 flex items-center gap-2 italic">⚠ {error}</div>}

                        {showAddressForm ? (
                            <form onSubmit={handleAddAddress} className="space-y-4 bg-slate-50/50 p-6 rounded-4xl border-2 border-dashed border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Add New Address</h4>
                                    <button type="button" onClick={() => setShowAddressForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>
                                <input 
                                    type="text" placeholder="Street Address" required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        type="text" placeholder="City" required
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="State" required
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                                    />
                                </div>
                                <input 
                                    type="text" placeholder="Zip Code" required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    value={newAddress.zip_code} onChange={e => setNewAddress({...newAddress, zip_code: e.target.value})}
                                />
                                <button type="submit" className="w-full bg-slate-900 text-white font-black py-3 rounded-xl uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">Save & Use Address</button>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map(addr => (
                                    <label key={addr.id} className={`flex items-start gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all relative ${selectedAddress === addr.id ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/5' : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'}`}>
                                        <input type="radio" className="mt-1 accent-brand-500" 
                                            name="address"
                                            checked={selectedAddress === addr.id}
                                            onChange={() => setSelectedAddress(addr.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin size={14} className={selectedAddress === addr.id ? 'text-brand-600' : 'text-slate-400'} />
                                                <h4 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{addr.city}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{addr.street}, {addr.zip_code}</p>
                                        </div>
                                    </label>
                                ))}
                                {addresses.length === 0 && (
                                    <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold text-sm">No saved addresses found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Payment Method Section */}
                    <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 mb-8">
                            <span className="bg-brand-500 text-white rounded-2xl h-10 w-10 flex items-center justify-center text-lg shadow-lg shadow-brand-500/30">2</span> 
                            Payment Options
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/5' : 'border-slate-100'}`}>
                                <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-brand-500" />
                                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                    <DollarSign size={20}/>
                                </div>
                                <div>
                                    <span className="font-black text-slate-800 uppercase tracking-tighter text-sm block">Cash on Delivery</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pay at your doorstep</span>
                                </div>
                            </label>
                            
                            <label className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/5' : 'border-slate-100'}`}>
                                <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-brand-500" />
                                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                                    <CreditCard size={20}/>
                                </div>
                                <div>
                                    <span className="font-black text-slate-800 uppercase tracking-tighter text-sm block">Card (Stripe)</span>
                                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Instant & Secure</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/5' : 'border-slate-100'}`}>
                                <input type="radio" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-brand-500" />
                                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                                    <CreditCard size={20}/>
                                </div>
                                <div>
                                    <span className="font-black text-slate-800 uppercase tracking-tighter text-sm block">Razorpay (Scan/UPI)</span>
                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Pay via UPI, Cards, Netbanking</span>
                                </div>
                            </label>
                        </div>

                        {paymentMethod === 'card' && (
                            <button
                                onClick={() => setShowConfirmation(true)}
                                className="w-full mt-8 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm hover:bg-emerald-700 hover:scale-[1.02] active:scale-95"
                            >
                                Proceed to Confirm
                            </button>
                        )}
                    </div>

                </div>

                <div className="w-full lg:w-96 shrink-0">
                    <div className="glass-card p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 sticky top-24">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b border-slate-50 pb-6 mb-6">Summary</h3>
                        
                        <div className="space-y-4 mb-8">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.product.name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.quantity} Unit{item.quantity>1?'s':''}</p>
                                    </div>
                                    <p className="font-black text-slate-900 text-sm">₹{(item.product.discount_price || item.product.price) * item.quantity}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-6 border-t border-slate-50 mb-8">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>₹{totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-brand-500 uppercase tracking-widest">
                                <span>Shipping</span>
                                <span>FREE</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8">
                            <span className="font-black text-slate-900 uppercase tracking-tighter text-lg">Total Due</span>
                            <span className="font-black text-3xl text-brand-600 tracking-tighter italic">₹{totalPrice}</span>
                        </div>

                        {paymentMethod === 'cod' && (
                            <button 
                                onClick={() => setShowConfirmation(true)}
                                disabled={isProcessing}
                                className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-white uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black hover:scale-[1.02] active:scale-95 shadow-black/10'}`}
                            >
                                {isProcessing ? 'Processing Order...' : 'Proceed to Confirm'}
                            </button>
                        )}

                        {paymentMethod === 'razorpay' && (
                            <button 
                                onClick={handleRazorpayPayment}
                                disabled={isProcessing}
                                className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-white uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-blue-500/10'}`}
                            >
                                {isProcessing ? 'Processing Payment...' : 'Pay with Razorpay'}
                            </button>
                        )}
                        <div className="mt-6 flex items-center justify-center gap-1.5 opacity-30 grayscale pointer-events-none">
                            <div className="h-6 w-10 bg-slate-200 rounded"></div>
                            <div className="h-6 w-10 bg-slate-200 rounded"></div>
                            <div className="h-6 w-10 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Checkout = () => {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutContent />
        </Elements>
    );
};

export default Checkout;
