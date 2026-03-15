import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const requiresRx = searchParams.get('rx') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Fetch categories for the filter sidebar
        const fetchCategories = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/products/categories/');
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                // Placeholder for Meilisearch integration
                // const client = new MeiliSearch({ host: 'http://localhost:7700', apiKey: 'masterKey' });
                // const index = client.index('products');
                // const search = await index.search(query, { ... });
                setResults([]);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [query, categoryId, requiresRx]);

    const handleCategoryChange = (id) => {
        const newParams = new URLSearchParams(searchParams);
        if (id === categoryId) {
            newParams.delete('category');
        } else {
            newParams.set('category', id);
        }
        setSearchParams(newParams);
    };

    const handleRxToggle = () => {
        const newParams = new URLSearchParams(searchParams);
        if (requiresRx === 'true') {
            newParams.delete('rx');
        } else {
            newParams.set('rx', 'true');
        }
        setSearchParams(newParams);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside className="w-full lg:w-64 space-y-8">
                <div className="glass-card rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-6 font-black text-emerald-deep uppercase tracking-widest text-sm">
                        <Filter size={18} className="text-brand-500" /> Filters
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                            Categories <SlidersHorizontal size={14} className="text-slate-400" />
                        </h4>
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                                        categoryId == cat.id 
                                        ? 'bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/20' 
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat.name}
                                    <ChevronRight size={14} className={categoryId == cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prescription Filter */}
                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-12 h-6 rounded-full transition-all relative ${requiresRx === 'true' ? 'bg-brand-500' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${requiresRx === 'true' ? 'left-7' : 'left-1'}`}></div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={requiresRx === 'true'} 
                                onChange={handleRxToggle} 
                                className="hidden" 
                            />
                            <span className="text-sm font-bold text-slate-700 group-hover:text-brand-600 transition-colors">Rx Required Only</span>
                        </label>
                    </div>
                </div>

                <div className="glass-card rounded-3xl p-6 bg-emerald-900 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-black mb-2 text-brand-300 uppercase tracking-tighter">Need Help?</h4>
                        <p className="text-xs text-emerald-100/70 mb-4">Connect with our licensed pharmacists for advice.</p>
                        <button className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
                            Start Chat
                        </button>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-500 rounded-full blur-2xl opacity-20"></div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Results for <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-600 to-emerald-600">"{query || 'All Products'}"</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{results.length} products found in the pharmacy collection</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="glass-card rounded-4xl p-5 h-[400px] animate-pulse bg-slate-50/50"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                        {results.length === 0 && (
                            <div className="col-span-full py-20 text-center glass-card rounded-[3rem]">
                                <div className="text-6xl mb-4">💊</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No medicines found</h3>
                                <p className="text-slate-400">Try adjusting your filters or search terms.</p>
                                <button 
                                    onClick={() => setSearchParams({ q: '' })}
                                    className="mt-6 text-brand-500 font-black uppercase text-xs tracking-widest hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchPage;
