import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-4 flex flex-col h-full bg-cover">
      <Link to={`/product/${product.id}`} className="group relative mb-4 h-40 flex justify-center items-center bg-gray-50 rounded-md p-2 overflow-hidden">
         {product.requires_prescription && (
           <span className="absolute top-2 left-2 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded z-10">Rx Required</span>
         )}
         <img 
           src={getImageUrl(product.image)} 
           alt={product.name} 
           className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
         />
      </Link>
      
      <div className="flex-grow">
        <Link to={`/product/${product.id}`}>
           <h3 className="text-lg font-bold text-gray-800 hover:text-brand-600 line-clamp-2 leading-tight mb-1">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 mb-2 truncate" title={product.generic_name}>
          {product.generic_name ? `Generics for ${product.generic_name}` : 'Unknown generic'}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
           {product.discount_price ? (
             <>
                <span className="text-lg font-extrabold text-gray-900">₹{product.discount_price}</span>
                <span className="text-sm font-medium text-gray-400 line-through">₹{product.price}</span>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                   {Math.round(((product.price - product.discount_price) / product.price) * 100)}% off
                </span>
             </>
           ) : (
             <span className="text-lg font-extrabold text-gray-900">₹{product.price}</span>
           )}
        </div>
      </div>
      
      <button 
        onClick={handleAddToCart}
        className="w-full mt-4 flex items-center justify-center gap-2 font-bold bg-white text-brand-500 border-2 border-brand-500 py-2 rounded shadow-sm hover:bg-brand-50 transition-colors"
      >
        <ShoppingCart size={18} /> Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
