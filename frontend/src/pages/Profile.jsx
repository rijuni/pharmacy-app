import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { logout, openAuthModal } from '../store/authSlice';
import { User, MapPin, Plus, LogOut, Package, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

const Profile = () => {
   const { user, isAuthenticated } = useSelector(state => state.auth);
   const [addresses, setAddresses] = useState([]);
   const [orders, setOrders] = useState([]);
   const [prescriptions, setPrescriptions] = useState([]);
   const [activeTab, setActiveTab] = useState('orders');
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // New Address Form State
   const [showAddressForm, setShowAddressForm] = useState(false);
   const [editingAddress, setEditingAddress] = useState(null);
   const [newAddress, setNewAddress] = useState({
      street: '',
      city: '',
      state: '',
      zip_code: '',
      is_default: false
   });

   useEffect(() => {
      if (!isAuthenticated) {
         navigate('/');
         dispatch(openAuthModal());
         return;
      }

      const fetchProfileData = async () => {
         try {
            const addrRes = await api.get('users/addresses/');
            setAddresses(addrRes.data);

            const ordRes = await api.get('orders/orders/');
            setOrders(ordRes.data);

            const pxRes = await api.get('orders/prescriptions/');
            setPrescriptions(pxRes.data);
         } catch (err) {
            console.error(err);
         }
      };

      fetchProfileData();
   }, [isAuthenticated, navigate, dispatch]);

   const handleLogout = () => {
      dispatch(logout());
      navigate('/');
   };

   const handleAddressSubmit = async (e) => {
      e.preventDefault();
      try {
         if (editingAddress) {
            const res = await api.put(`users/addresses/${editingAddress.id}/`, newAddress);
            setAddresses(addresses.map(a => a.id === editingAddress.id ? res.data : a));
            setEditingAddress(null);
         } else {
            const res = await api.post('users/addresses/', newAddress);
            setAddresses([...addresses, res.data]);
         }
         setShowAddressForm(false);
         setNewAddress({ street: '', city: '', state: '', zip_code: '', is_default: false });
      } catch {
         alert("Error saving address.");
      }
   };

   const handleAddressDelete = async (id) => {
      if (window.confirm("Delete this address?")) {
         try {
            await api.delete(`users/addresses/${id}/`);
            setAddresses(addresses.filter(a => a.id !== id));
         } catch {
            alert("Error deleting address.");
         }
      }
   };

   const handleEditAddress = (addr) => {
      setEditingAddress(addr);
      setNewAddress({
         street: addr.street,
         city: addr.city,
         state: addr.state,
         zip_code: addr.zip_code,
         is_default: addr.is_default
      });
      setShowAddressForm(true);
   };

   if (!user) return null;

   return (
      <div className="flex flex-col md:flex-row gap-6">
         {/* Sidebar ... (omitted for brevity) */}
         <aside className="w-full md:w-64 shrink-0">
            {/* Same sidebar as before */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="bg-brand-50 p-6 flex flex-col items-center">
                  <div className="bg-brand-500 text-white rounded-full p-4 mb-3">
                     <User size={32} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{user.first_name || user.username}</h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
               </div>
               
               <div className="p-2">
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${activeTab === 'orders' ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                     <Package size={18} /> My Orders
                  </button>
                  <button 
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${activeTab === 'addresses' ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                     <MapPin size={18} /> Manage Addresses
                  </button>
                  <button 
                    onClick={() => setActiveTab('prescriptions')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${activeTab === 'prescriptions' ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                     <FileText size={18} /> My Prescriptions
                  </button>
                  <div className="h-px bg-gray-100 my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                     <LogOut size={18} /> Logout
                  </button>
               </div>
            </div>
         </aside>

         {/* Content Area */}
         <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-125">
               {activeTab === 'orders' && (
                  <div>
                     <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
                     {orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                           <Package size={48} className="mx-auto text-gray-300 mb-4" />
                           <p>You haven't placed any orders yet.</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {orders.map(order => (
                              <div key={order.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                                 <div className="flex justify-between items-center mb-4 border-b pb-3">
                                    <div>
                                       <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Order #{order.id}</span>
                                       <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                          {order.status.replace('_', ' ')}
                                       </span>
                                       <button onClick={() => navigate(`/order-tracking/${order.id}`)} className="text-brand-600 hover:underline text-xs font-bold">Track Order</button>
                                    </div>
                                 </div>
                                 <div className="space-y-2 mb-4">
                                    {order.items.map(item => (
                                       <div key={item.id} className="flex justify-between text-sm">
                                          <span>{item.quantity}x {item.product.name}</span>
                                          <span className="font-medium">₹{item.price}</span>
                                       </div>
                                    ))}
                                 </div>
                                 <div className="flex justify-between items-center pt-3 border-t">
                                    <span className="text-gray-600">Total Paid</span>
                                    <span className="font-extrabold text-gray-900 text-lg">₹{order.total_price}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'addresses' && (
                  <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Manage Addresses</h2>
                        <button onClick={() => {setShowAddressForm(!showAddressForm); setEditingAddress(null); setNewAddress({street: '', city: '', state: '', zip_code: '', is_default: false})}} className="bg-brand-50 text-brand-600 hover:bg-brand-100 px-4 py-2 flex items-center gap-2 rounded-lg font-bold transition-colors">
                           <Plus size={18} /> Add New
                        </button>
                     </div>

                     {showAddressForm && (
                        <form onSubmit={handleAddressSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Street Address</label>
                              <input type="text" required value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="w-full border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                              <input type="text" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State</label>
                              <input type="text" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Zip Code</label>
                              <input type="text" required value={newAddress.zip_code} onChange={e => setNewAddress({...newAddress, zip_code: e.target.value})} className="w-full border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500" />
                           </div>
                           <div className="col-span-2 mt-4 flex justify-end gap-3">
                              <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                              <button type="submit" className="bg-brand-500 text-white px-6 py-2 rounded font-bold hover:bg-brand-600 transition-colors uppercase text-xs tracking-widest">{editingAddress ? 'Update' : 'Save'} Address</button>
                           </div>
                        </form>
                     )}

                     {addresses.length === 0 ? (
                        <p className="text-gray-500 py-4">No addresses saved yet.</p>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {addresses.map(addr => (
                              <div key={addr.id} className="border border-gray-200 rounded-lg p-5 flex flex-col gap-3">
                                 <div className="flex items-start gap-3">
                                    <MapPin className="text-brand-500 mt-1" size={20} />
                                    <div className="flex-1">
                                       <h4 className="font-bold text-gray-900">{addr.street}</h4>
                                       <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.zip_code}</p>
                                    </div>
                                 </div>
                                 <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                                    <button onClick={() => handleEditAddress(addr)} className="text-brand-600 font-bold text-xs uppercase p-2 hover:bg-brand-50 rounded">Edit</button>
                                    <button onClick={() => handleAddressDelete(addr.id)} className="text-red-600 font-bold text-xs uppercase p-2 hover:bg-red-50 rounded">Delete</button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'prescriptions' && (
                  <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">My Prescriptions</h2>
                        <button onClick={() => navigate('/prescriptions')} className="bg-brand-500 text-white hover:bg-brand-600 px-4 py-2 flex items-center gap-2 rounded-lg font-bold transition-all shadow-lg shadow-brand-500/20">
                           <Plus size={18} /> Upload New
                        </button>
                     </div>

                     {prescriptions.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                           <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-slate-400 font-medium">No prescriptions uploaded yet.</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {prescriptions.map(px => (
                              <div key={px.id} className="glass-card rounded-2xl overflow-hidden border border-slate-100 flex flex-col">
                                 <div className="h-40 bg-slate-100 relative overflow-hidden group">
                                    <img src={`http://localhost:8000${px.image}`} alt="Prescription" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                       <a href={`http://localhost:8000${px.image}`} target="_blank" rel="noreferrer" className="bg-white/90 p-2 rounded-full text-slate-900">
                                          <ExternalLink size={20} />
                                       </a>
                                    </div>
                                 </div>
                                 <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(px.created_at).toLocaleDateString()}</span>
                                       <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                         px.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                         px.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                         'bg-amber-50 text-amber-600 border border-amber-100'
                                       }`}>
                                          {px.status === 'Verified' ? <CheckCircle size={10}/> : px.status === 'Rejected' ? <XCircle size={10}/> : <Clock size={10}/>}
                                          {px.status}
                                       </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-semibold line-clamp-1 italic">
                                       {px.is_verified ? "✅ Verified by Pharmacist" : "⏳ Pending verification"}
                                    </p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </main>
      </div>
   );
};

export default Profile;
