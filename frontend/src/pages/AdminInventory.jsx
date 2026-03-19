import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Trash2, AlertCircle, CheckCircle2, X, Tag } from 'lucide-react';
import api from '../api/axios';

const AdminInventory = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Notification state
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Inline category creation state
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        generic_name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        manufacturer: '',
        strength: '',
        form: '',
        requires_prescription: false,
        availability_status: 'in_stock'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('products/products/'),
                api.get('products/categories/')
            ]);
            
            // Handle both paginated and non-paginated results
            const productsData = productsRes.data.results || productsRes.data;
            const categoriesData = categoriesRes.data.results || categoriesRes.data;
            
            setProducts(Array.isArray(productsData) ? productsData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (err) {
            console.error("Failed to fetch inventory data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        setImageFile(null);
        setImagePreview(null);
        if (product) {
            setEditingProduct(product);
            if (product.image) setImagePreview(product.image);
            // Handle both object and ID formats for category
            let catId = '';
            if (product.category) {
                catId = typeof product.category === 'object' ? product.category.id : product.category;
            }
            setFormData({
                ...product,
                category: catId
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                generic_name: '',
                category: categories.length > 0 ? categories[0].id : '',
                price: '',
                stock: '',
                description: '',
                manufacturer: '',
                strength: '',
                form: '',
                requires_prescription: false,
                availability_status: 'in_stock'
            });
        }
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const data = new FormData();
            
            // Append all form fields to FormData
            Object.keys(formData).forEach(key => {
                if (key === 'image' || key === 'category_name' || key === 'is_available' || key === 'substitutes' || key === 'created_at' || key === 'updated_at') return;
                
                // If it's a nested object (like category), just send the ID
                let value = formData[key];
                if (key === 'category' && typeof value === 'object') value = value.id;
                
                data.append(key, value);
            });

            // Only append image if a new file was selected
            if (imageFile) {
                data.append('image', imageFile);
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (editingProduct) {
                await api.put(`products/products/${editingProduct.id}/`, data, config);
                showNotification(`"${formData.name}" updated successfully!`);
            } else {
                await api.post('products/products/', data, config);
                showNotification(`"${formData.name}" added to inventory!`);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Failed to save product", err);
            showNotification("Error saving product. Please check all fields.", "error");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`products/products/${id}/`);
                showNotification("Product deleted successfully!");
                fetchData();
            } catch (err) {
                console.error("Failed to delete product", err);
                showNotification("Failed to delete product.", "error");
            }
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsAddingCategory(true);
        try {
            const res = await api.post('products/categories/', { name: newCategoryName });
            
            // Refresh categories list
            const categoriesRes = await api.get('products/categories/');
            const categoriesData = categoriesRes.data.results || categoriesRes.data;
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            
            // Select the newly created category
            setFormData({ ...formData, category: res.data.id });
            
            showNotification(`Category "${newCategoryName}" created!`);
            
            // Reset input
            setNewCategoryName('');
            setShowCategoryInput(false);
        } catch (err) {
            console.error("Failed to create category", err);
            showNotification("Error creating category. It might already exist.", "error");
        } finally {
            setIsAddingCategory(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse text-4xl italic">LOADING INVENTORY...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black tracking-tighter mb-2">Inventory Management</h1>
                    <p className="text-slate-400 font-medium">Add, update and monitor your medicine stock</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
                >
                    <Plus size={20} /> Add New Medicine
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Stats Sidebar */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="glass-card p-6 rounded-[2rem] border border-slate-100">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Stock Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm font-bold">Total Items</span>
                                <span className="font-black text-slate-900">{products.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-rose-500 text-sm font-bold">Low Stock</span>
                                <span className="font-black text-rose-600">{products.filter(p => p.stock <= 10 && p.stock > 0).length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm font-bold">Out of Stock</span>
                                <span className="font-black text-slate-400">{products.filter(p => p.stock === 0).length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-[2rem] border border-slate-100">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Quick Search</h3>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:w-3/4">
                    <div className="glass-card rounded-[2.5rem] border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-6 px-8">Product Name</th>
                                        <th className="py-6 px-4">Category</th>
                                        <th className="py-6 px-4">Price</th>
                                        <th className="py-6 px-4">Stock</th>
                                        <th className="py-6 px-4">Status</th>
                                        <th className="py-6 px-8 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredProducts.map((p) => (
                                        <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                                            <Package className="text-slate-300" size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm leading-tight">{p.name}</p>
                                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{p.generic_name || 'BRANDED'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-sm font-bold text-slate-600">
                                                {p.category_name || (typeof p.category === 'object' ? p.category.name : 'Unknown')}
                                            </td>
                                            <td className="py-6 px-4 text-sm font-black text-slate-900">₹{p.price}</td>
                                            <td className="py-6 px-4">
                                                <div className={`flex items-center gap-2 font-black text-sm ${
                                                    p.stock <= 10 ? (p.stock === 0 ? 'text-slate-400' : 'text-rose-500') : 'text-emerald-500'
                                                }`}>
                                                    {p.stock}
                                                    {p.stock <= 10 && p.stock > 0 && <AlertCircle size={14} />}
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                    p.availability_status === 'in_stock' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {p.availability_status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-2 outline-none">
                                                    <button 
                                                        onClick={() => handleOpenModal(p)}
                                                        className="p-2 hover:bg-white hover:text-brand-500 text-slate-400 rounded-lg transition-all"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p.id)}
                                                        className="p-2 hover:bg-white hover:text-rose-500 text-slate-400 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-3xl font-black tracking-tighter text-slate-900">
                                {editingProduct ? 'Edit Medicine' : 'Add Medicine'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Medicine Name</label>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                        placeholder="e.g. Paracetamol 500mg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Generic Name</label>
                                    <input 
                                        type="text"
                                        value={formData.generic_name}
                                        onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                        placeholder="e.g. Acetaminophen"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                                        <button 
                                            type="button"
                                            onClick={() => setShowCategoryInput(!showCategoryInput)}
                                            className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-1 hover:text-brand-600"
                                        >
                                            {showCategoryInput ? <X size={12} /> : <Plus size={12} />}
                                            {showCategoryInput ? 'Cancel' : 'New Category'}
                                        </button>
                                    </div>

                                    {showCategoryInput ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                                placeholder="Enter category name..."
                                                autoFocus
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleCreateCategory}
                                                disabled={isAddingCategory || !newCategoryName.trim()}
                                                className="px-6 bg-brand-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ) : (
                                        <select 
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.length === 0 && <option disabled>Loading categories...</option>}
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Product Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={24} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="product-image"
                                            />
                                            <label
                                                htmlFor="product-image"
                                                className="inline-block px-4 py-2 bg-brand-50 text-brand-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-brand-100 transition-colors"
                                            >
                                                {imagePreview ? 'Change Image' : 'Select Image'}
                                            </label>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Price (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stock Quantity</label>
                                    <input 
                                        required
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
                                    <select 
                                        value={formData.availability_status}
                                        onChange={(e) => setFormData({...formData, availability_status: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                    >
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                        <option value="discontinued">Discontinued</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <textarea 
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none resize-none"
                                    placeholder="Product description and usage instructions..."
                                ></textarea>
                            </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Manufacturer (Brand)</label>
                                        <input
                                            type="text"
                                            value={formData.manufacturer}
                                            onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                            placeholder="e.g. Cipla, GSK"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Strength</label>
                                        <input
                                            type="text"
                                            value={formData.strength}
                                            onChange={(e) => setFormData({...formData, strength: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                            placeholder="e.g. 500mg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Form</label>
                                        <input
                                            type="text"
                                            value={formData.form}
                                            onChange={(e) => setFormData({...formData, form: e.target.value})}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-brand-500 font-bold text-slate-700 outline-none"
                                            placeholder="e.g. Tablet, Syrup"
                                        />
                                    </div>
                                </div>

                            <div className="mt-8 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <input 
                                    type="checkbox"
                                    id="rx-req"
                                    checked={formData.requires_prescription}
                                    onChange={(e) => setFormData({...formData, requires_prescription: e.target.checked})}
                                    className="w-5 h-5 accent-brand-500"
                                />
                                <label htmlFor="rx-req" className="font-bold text-slate-700">Requires Prescription (Rx)</label>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500 hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                                >
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-3 px-8 py-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500 font-black tracking-tight ${
                    notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                    {notification.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                    <div className="flex flex-col">
                        <span className="text-[10px] opacity-70 uppercase tracking-widest">{notification.type === 'error' ? 'Error' : 'Success'}</span>
                        <span className="text-sm">{notification.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
