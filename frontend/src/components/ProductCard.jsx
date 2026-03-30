import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { openAuthModal } from '../store/authSlice';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [isWishlisted, setIsWishlisted] = React.useState(() => {
    const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return list.includes(product.id);
  });

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isWishlisted) {
      list = list.filter(id => id !== product.id);
      toast.success('Removed from Wishlist', { icon: '💔' });
    } else {
      list.push(product.id);
      toast.success('Added to Wishlist', { icon: '❤️' });
    }
    localStorage.setItem('wishlist', JSON.stringify(list));
    setIsWishlisted(!isWishlisted);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
        dispatch(openAuthModal());
        return;
    }
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150?text=No+Image";
    if (imagePath.startsWith('http')) return imagePath;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}${imagePath}`;
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="glass-card rounded-[2.5rem] p-6 flex flex-col h-full group border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-brand-500/10 transition-all"
    >
      <Link to={`/product/${product.id}`} className="relative mb-6 block h-56 bg-slate-50/50 rounded-[2rem] p-8 overflow-hidden group-hover:bg-brand-50/30 transition-colors">
        {!product.is_available && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2rem] flex items-center justify-center z-20">
            <span className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-tighter italic -rotate-12">Out of Stock</span>
          </div>
        )}
        <button 
          onClick={toggleWishlist}
          className={`absolute top-4 right-4 transition-all z-10 p-2 bg-white rounded-xl shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 ${isWishlisted ? 'text-rose-500' : 'text-slate-300 hover:text-rose-500'}`}
        >
          <Heart size={20} className={isWishlisted ? 'fill-rose-500' : ''} />
        </button>
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className={`h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ${!product.is_available && 'grayscale opacity-30'}`}
        />
      </Link>

      <div className="grow space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Link to={`/product/${product.id}`} className="grow">
            <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tighter leading-none mb-2">
              {product.name}
            </h3>
          </Link>
          {product.requires_prescription && (
            <span className="shrink-0 bg-rose-50 text-rose-600 text-[8px] font-black px-2 py-1 rounded-lg border border-rose-100 uppercase tracking-widest h-fit mt-1">Rx</span>
          )}
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
               <Star size={10} className="fill-amber-400 text-amber-400" />
               <span className="text-[10px] font-black text-amber-700">{product.average_rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">
               {product.reviews?.length || 0} REVIEWS
            </span>
        </div>
        <p className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-2 flex-wrap">
           {product.manufacturer && <span className="bg-brand-50 px-2 py-0.5 rounded text-[10px]">{product.manufacturer}</span>}
           <span className="text-slate-400 font-medium">{product.generic_name || 'Health Essential'}</span>
        </p>

        <div className="flex items-center gap-3 pt-2">
          {product.discount_price ? (
            <>
              <span className="text-2xl font-black text-slate-900">₹{product.discount_price}</span>
              <span className="text-sm font-bold text-slate-300 line-through">₹{product.price}</span>
              <div className="bg-brand-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
              </div>
            </>
          ) : (
            <span className="text-2xl font-black text-slate-900">₹{product.price}</span>
          )}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleAddToCart}
        disabled={!product.is_available}
        className={`w-full mt-6 flex items-center justify-center gap-2 font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all ${
          product.is_available 
            ? 'bg-brand-500 text-white shadow-brand-500/20 hover:bg-brand-600 cursor-pointer' 
            : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
        }`}
      >
        <ShoppingCart size={18} /> {product.is_available ? 'Add to Cart' : 'Out of Stock'}
      </motion.button>
    </motion.div>
  );
};

export default ProductCard;
