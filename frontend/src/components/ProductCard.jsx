import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150?text=No+Image";
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath}`;
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="glass-card rounded-4xl p-5 flex flex-col h-full group"
    >
      <Link to={`/product/${product.id}`} className="relative mb-6 block h-48 bg-slate-50 rounded-3xl p-6 overflow-hidden">
        {product.requires_prescription && (
          <span className="absolute top-3 left-3 bg-red-100/80 backdrop-blur-sm text-red-700 text-[10px] font-black px-3 py-1.5 rounded-full z-10 uppercase tracking-wider shadow-sm">Rx Required</span>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
            <span className="bg-red-600 text-white text-xs font-black px-4 py-2 rounded-full">OUT OF STOCK</span>
          </div>
        )}
        <button className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors z-10">
          <Heart size={20} />
        </button>
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className={`h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ${!product.is_available && 'opacity-50'}`}
        />
      </Link>

      <div className="grow space-y-2">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-tight">{product.name}</h3>
        </Link>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          {product.generic_name || 'Health Essential'}
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
