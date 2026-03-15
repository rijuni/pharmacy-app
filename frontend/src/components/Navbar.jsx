import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, ShoppingCart, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, openAuthModal } from '../store/authSlice';

const Navbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
     dispatch(logout());
     setShowDropdown(false);
     navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`http://localhost:8000/api/products/search/?q=${encodeURIComponent(searchQuery)}`);
          const results = await response.json();
          setSearchResults(Array.isArray(results) ? results.slice(0, 5) : []);
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <header className="glass-card sticky top-0 z-50 transition-all duration-300">
      {/* Top Banner */}
      <div className="bg-brand-50/80 px-4 py-1.5 flex justify-center items-center w-full border-b border-brand-100">
        <div className="bg-brand-100 text-brand-700 text-[11px] font-extrabold px-4 py-1 rounded-full flex items-center gap-2 shadow-sm border border-brand-200 animate-pulse uppercase tracking-widest cursor-default">
           🚨 Fast Delivery within 3km of Hospital
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-emerald-deep tracking-tighter">
              Health<span className="text-brand-500">Meds</span>
            </h1>
            <span className="bg-brand-100 text-brand-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:block">
              Pharmacy
            </span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative">
             <form onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/search?q=${searchQuery}`);
                  setSearchResults([]);
                }
             }} className="w-full relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Medicines, Lab Tests, and More..." 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                />
                <button type="submit" className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-brand-500">
                  <Search size={20} />
                </button>
             </form>

             {/* Search Results Dropdown */}
             {searchResults.length > 0 && (
               <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-b-xl shadow-xl z-50 max-h-96 overflow-y-auto mt-1">
                 {searchResults.slice(0, 5).map((result) => (
                   <Link 
                     key={result.id} 
                     to={`/product/${result.id}`}
                     onClick={() => setSearchResults([])}
                     className="flex items-center gap-4 p-4 hover:bg-brand-50 transition-colors border-b border-gray-50 last:border-0"
                   >
                     <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-brand-500 font-bold">
                       {result.name[0]}
                     </div>
                     <div>
                       <p className="font-bold text-gray-900">{result.name}</p>
                       <p className="text-xs text-gray-500 line-clamp-1">{result.description}</p>
                     </div>
                     <div className="ml-auto font-black text-brand-600">
                       ₹{result.price}
                     </div>
                   </Link>
                 ))}
                 <Link 
                   to={`/search?q=${searchQuery}`}
                   onClick={() => setSearchResults([])}
                   className="block p-3 text-center text-sm font-bold text-brand-600 hover:bg-brand-50 transition-colors"
                 >
                   See all {searchResults.length} results
                 </Link>
               </div>
             )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            <nav className="hidden lg:flex space-x-6">
              <Link to="/medicines" className="text-gray-700 hover:text-brand-500 font-medium whitespace-nowrap">Medicines</Link>
              <Link to="/prescriptions" className="text-gray-700 hover:text-brand-500 font-medium whitespace-nowrap">Upload Rx</Link>
            </nav>

            <Link to="/cart" className="relative text-gray-700 hover:text-brand-500">
              <ShoppingCart size={24} />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                 <button 
                   onClick={() => setShowDropdown(!showDropdown)}
                   className="flex items-center gap-2 text-gray-700 hover:text-brand-500 focus:outline-none"
                 >
                   <div className="bg-brand-50 p-1.5 rounded-full">
                      <UserIcon size={20} className="text-brand-600" />
                   </div>
                   <span className="font-medium hidden sm:block">{user?.username || 'Profile'}</span>
                   <ChevronDown size={14} className="text-gray-400" />
                 </button>

                 {/* Dropdown Menu */}
                 {showDropdown && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                       <div className="px-4 py-2 border-b border-gray-50 mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.email || user?.username}</p>
                       </div>
                       <Link to="/profile" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600">
                          My Profile & Orders
                       </Link>
                       <button 
                         onClick={handleLogout}
                         className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                       >
                          <LogOut size={16} /> Logout
                       </button>
                    </div>
                 )}
              </div>
            ) : (
              <button onClick={() => dispatch(openAuthModal())} className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-sm whitespace-nowrap">
                Login / Signup
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
