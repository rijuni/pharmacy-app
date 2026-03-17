import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Filter } from 'lucide-react';

const Medicines = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('products/categories/');
        const data = response.data.results || response.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
        // Error on categories is usually a sign of backend being down
        setError("Unable to connect to health server. Please check your connection.");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = 'products/products/';
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await api.get(url);
        // Ensure we always have an array
        const data = response.data.results || response.data;
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
          console.warn("Unexpected API response format", response.data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
        setError("Failed to load medicines. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h3 className="font-bold border-b pb-3 mb-4 flex items-center gap-2">
            <Filter size={18} /> Filters
          </h3>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Categories</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio" name="category" value=""
                  checked={selectedCategory === ''}
                  onChange={() => setSelectedCategory('')}
                  className="text-brand-500 focus:ring-brand-500"
                />
                <span>All Products</span>
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio" name="category" value={cat.id}
                    checked={selectedCategory === String(cat.id)}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-brand-500 focus:ring-brand-500"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for medicines specifically..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-rose-50 rounded-xl border-2 border-dashed border-rose-200">
            <h3 className="text-xl font-bold text-rose-700 mb-2">Service Temporarily Unavailable</h3>
            <p className="text-rose-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-rose-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-700 mb-2">No medicines found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Medicines;
