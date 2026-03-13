import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { logout, openAuthModal } from '../store/authSlice';
import { User, MapPin, Plus, LogOut, Package } from 'lucide-react';

const Profile = () => {
   const { user, isAuthenticated } = useSelector(state => state.auth);
   const [addresses, setAddresses] = useState([]);
   const [orders, setOrders] = useState([]);
   const [activeTab, setActiveTab] = useState('orders');
   const dispatch = useDispatch();
   const navigate = useNavigate();

   // New Address Form State
   const [showAddressForm, setShowAddressForm] = useState(false);
   const [newAddress, setNewAddress] = useState({
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      latitude: '',
      longitude: ''
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
         const res = await api.post('users/addresses/', newAddress);
         setAddresses([...addresses, res.data]);
         setShowAddressForm(false);
         setNewAddress({street_address: '', city: '', state: '', postal_code: '', latitude: '', longitude: ''});
      } catch {
         alert("Error adding address. Please ensure latitude and longitude are valid numbers.");
      }
   };

   if (!user) return null;

   return (
      <div className="flex flex-col md:flex-row gap-6">
         {/* Sidebar */}
         <aside className="w-full md:w-64 shrink-0">
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                       {order.status.replace('_', ' ')}
                                    </span>
                                 </div>
                                 <div className="space-y-2 mb-4">
                                    {order.items.map(item => (
                                       <div key={item.id} className="flex justify-between text-sm">
                                          <span>{item.quantity}x {item.product_details.name}</span>
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
                        <button onClick={() => setShowAddressForm(!showAddressForm)} className="bg-brand-50 text-brand-600 hover:bg-brand-100 px-4 py-2 flex items-center gap-2 rounded-lg font-bold transition-colors">
                           <Plus size={18} /> Add New
                        </button>
                     </div>

                     {showAddressForm && (
                        <form onSubmit={handleAddressSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Street Address</label>
                              <input type="text" required value={newAddress.street_address} onChange={e => setNewAddress({...newAddress, street_address: e.target.value})} className="w-full border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500" />
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
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Postal Code</label>
                              <input type="text" required value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} className="w-full border-gray-300 rounded p-2 focus:ring-brand-500 focus:border-brand-500" />
                           </div>
                           <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 bg-blue-50 border border-blue-100 p-4 rounded text-blue-900 text-sm">
                              <div className="col-span-2 flex items-start gap-2 mb-2">
                                 <MapPin size={18} className="shrink-0 mt-0.5" />
                                 <p className="font-medium">For MVP Geofencing: You must manually provide exact GPS Coordinates. Hospital is located at [28.6139, 77.2090]. Address must be within 3km of this to successfully place orders.</p>
                              </div>
                              <div>
                                 <label className="block text-xs font-bold uppercase mb-1">Latitude</label>
                                 <input type="number" step="any" required value={newAddress.latitude} onChange={e => setNewAddress({...newAddress, latitude: e.target.value})} className="w-full border-gray-300 rounded p-2" placeholder="e.g. 28.6250" />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold uppercase mb-1">Longitude</label>
                                 <input type="number" step="any" required value={newAddress.longitude} onChange={e => setNewAddress({...newAddress, longitude: e.target.value})} className="w-full border-gray-300 rounded p-2" placeholder="e.g. 77.2150" />
                              </div>
                           </div>
                           <div className="col-span-2 mt-4 flex justify-end gap-3">
                              <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                              <button type="submit" className="bg-brand-500 text-white px-6 py-2 rounded font-bold hover:bg-brand-600 transition-colors">Save Address</button>
                           </div>
                        </form>
                     )}

                     {addresses.length === 0 ? (
                        <p className="text-gray-500 py-4">No addresses saved yet.</p>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {addresses.map(addr => (
                              <div key={addr.id} className="border border-gray-200 rounded-lg p-5 flex items-start gap-3">
                                 <MapPin className="text-gray-400 mt-1" size={24} />
                                 <div>
                                    <h4 className="font-bold text-gray-900">{addr.street_address}</h4>
                                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                                    <p className="text-xs text-gray-400 mt-2 font-mono">Lat: {addr.latitude}, Lng: {addr.longitude}</p>
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
