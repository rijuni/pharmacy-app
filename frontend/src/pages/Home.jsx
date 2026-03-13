import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, PhoneCall } from 'lucide-react';
import ProductCard from '../components/ProductCard';

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
      {/* Hero Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-gradient-to-r from-brand-100 to-brand-50 rounded-2xl p-8 flex flex-col justify-center border border-brand-200 shadow-sm relative overflow-hidden">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
               Your Go-To <span className="text-brand-600">Online Pharmacy</span> <br/>
               within 3km of the Hospital
            </h2>
            <p className="text-gray-600 mb-8 max-w-md text-lg">
               Order medicines, upload prescriptions, and book lab tests from the comfort of your home with guaranteed fast delivery.
            </p>
            <div className="flex gap-4">
               <Link to="/medicines" className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105">
                 Order Medicines
               </Link>
               <Link to="/prescriptions" className="bg-white hover:bg-gray-50 text-brand-600 font-bold py-3 px-8 rounded-lg border-2 border-brand-500 shadow-sm transition-colors">
                 Upload Rx
               </Link>
            </div>
         </div>
         
         <div className="bg-blue-50 rounded-2xl p-8 flex flex-col justify-center border border-blue-100 shadow-sm items-center text-center">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
               <Truck size={40} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Free Delivery</h3>
            <p className="text-gray-600 mb-6">On all orders above ₹500 within our strict 3km hospital limit.</p>
            <Link to="/prescriptions" className="text-blue-600 font-bold hover:underline py-2">Know More &rarr;</Link>
         </div>
      </div>

      {/* Trust Markers */}
      <div className="bg-white py-6 px-8 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-6">
         <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="text-brand-500"/>
            <div>
               <h4 className="font-bold text-gray-900">100% Genuine Medicines</h4>
               <p className="text-xs text-gray-500">Sourced directly from manufacturers</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <RefreshCw size={32} className="text-brand-500"/>
            <div>
               <h4 className="font-bold text-gray-900">Easy Returns</h4>
               <p className="text-xs text-gray-500">Hassle-free return policy</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <PhoneCall size={32} className="text-brand-500"/>
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
