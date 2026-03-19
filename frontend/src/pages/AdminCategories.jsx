import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit3, Trash2, X, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react';
import api from '../api/axios';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('products/categories/');
            const data = res.data.results || res.data;
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || ''
            });
            setImagePreview(category.image || null);
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
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
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (editingCategory) {
                await api.put(`products/categories/${editingCategory.id}/`, data, config);
            } else {
                await api.post('products/categories/', data, config);
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (err) {
            console.error("Failed to save category", err);
            alert("Error saving category. Name might already exist.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Deleting a category might affect medicines assigned to it. Proceed?")) {
            try {
                await api.delete(`products/categories/${id}/`);
                fetchCategories();
            } catch (err) {
                console.error("Failed to delete category", err);
                alert("Cannot delete category. It might have medicines associated with it.");
            }
        }
    };

    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse text-4xl italic">LOADING TAXONOMY...</div>;

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-black tracking-tighter mb-2">Category Manager</h1>
                    <p className="text-emerald-100 font-medium">Organize your pharmacy inventory into logical groups</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all flex items-center gap-2 shadow-lg"
                >
                    <Plus size={20} /> New Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                    <div key={cat.id} className="glass-card p-8 rounded-[2.5rem] border border-slate-100 flex flex-col group hover:border-emerald-200 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                                {cat.image ? (
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-contain mix-blend-multiply" />
                                ) : (
                                    <Tag size={24} className="text-emerald-500" />
                                )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(cat)} className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all">
                                    <Edit3 size={18} />
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{cat.name}</h3>
                        <p className="text-slate-500 text-sm font-medium grow line-clamp-2">
                            {cat.description || 'No description provided for this category.'}
                        </p>
                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Status</span>
                            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black">
                                <CheckCircle2 size={12} /> ACTIVE
                            </div>
                        </div>
                    </div>
                ))}

                {categories.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
                        <LayoutGrid size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-slate-400 font-black uppercase italic">No categories found</h3>
                        <p className="text-slate-400 text-sm">Start by adding your first medicine category</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-3xl font-black tracking-tighter text-slate-900">
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Image Upload Area */}
                            <div className="flex justify-center mb-4">
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <Tag size={40} className="text-slate-300" />
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <Plus className="text-white" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category Name</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-emerald-500 font-bold text-slate-700 outline-none"
                                    placeholder="e.g. Antibiotics"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                <textarea 
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-emerald-500 font-bold text-slate-700 outline-none resize-none"
                                    placeholder="Brief description of medications in this category..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg"
                                >
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
