import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';

const StripePaymentForm = ({ amount, onPaymentSuccess, isProcessing: parentProcessing }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLocalProcessing, setIsLocalProcessing] = useState(false);
    const [cardError, setCardError] = useState(null);

    const isProcessing = parentProcessing || isLocalProcessing;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsLocalProcessing(true);
        setCardError(null);

        const cardElement = elements.getElement(CardElement);

        try {
            // 1. Create Payment Intent on our backend
            const { data } = await import('../api/axios').then(m => m.default.post('orders/payment/create-intent/'));
            
            // 2. Confirm the payment with Stripe
            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: cardElement,
                }
            });

            if (result.error) {
                setCardError(result.error.message);
                setIsLocalProcessing(false);
            } else {
                if (result.paymentIntent.status === 'succeeded') {
                    onPaymentSuccess(result.paymentIntent.id);
                }
            }
        } catch (err) {
            setCardError("Payment failed. Please try again.");
            setIsLocalProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <CreditCard size={12} /> Secure Card Entry
                    </span>
                    <div className="flex gap-1 text-slate-300">
                        <Lock size={12} />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 transition-all">
                    <CardElement 
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#1e293b',
                                    '::placeholder': { color: '#94a3b8' },
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {cardError && (
                <div className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-lg border border-rose-100 italic">
                    ⚠ {cardError}
                </div>
            )}

            <button 
                type="submit"
                disabled={isProcessing || !stripe}
                className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-white uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 hover:scale-[1.02] active:scale-95 shadow-brand-500/20'}`}
            >
                {isProcessing ? 'Authorizing...' : `Pay ₹${amount} Now`}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                🔒 Your payment is encrypted and secured by Stripe
            </p>
        </form>
    );
};

export default StripePaymentForm;
