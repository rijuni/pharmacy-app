import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`}></div>
  );
};

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
    <Skeleton className="w-full aspect-square mb-6 rounded-3xl" />
    <Skeleton className="h-3 w-1/3 mb-4" />
    <Skeleton className="h-6 w-3/4 mb-4" />
    <div className="flex justify-between items-center mt-8">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-10 w-1/3 rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
