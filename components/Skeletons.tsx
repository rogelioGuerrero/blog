import React from 'react';

export const GridSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto">
       {/* Hero Skeleton */}
       <div className="mb-12 md:mb-20 rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/50 h-[500px] md:h-[600px] relative animate-pulse">
          <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-4xl space-y-4">
              <div className="h-6 w-24 bg-slate-300 dark:bg-slate-800 rounded-full"></div>
              <div className="h-12 md:h-16 w-3/4 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-12 md:h-16 w-1/2 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-6 w-2/3 bg-slate-300 dark:bg-slate-800 rounded mt-4"></div>
          </div>
       </div>

       {/* Grid Header Skeleton */}
       <div className="flex justify-between items-center mb-8">
           <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
           <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
       </div>

       {/* Bento Grid Skeleton */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
             <div 
                key={i} 
                className={`rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col animate-pulse ${i === 1 ? 'md:col-span-2' : ''}`}
             >
                <div className="flex-1 bg-slate-200 dark:bg-slate-800 relative"></div>
                <div className="p-8 space-y-3 bg-white dark:bg-slate-900">
                    <div className="flex justify-between">
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                        <div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-8 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded mt-2"></div>
                    <div className="flex gap-2 pt-2">
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export const ArticleSkeleton = () => {
  return (
    <div className="max-w-[720px] mx-auto animate-pulse">
       {/* Nav Skeleton */}
       <div className="mb-12 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
           <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
           <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
       </div>

       {/* Header Skeleton */}
       <div className="space-y-6 mb-10">
           <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
           <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
           <div className="h-6 w-full bg-slate-100 dark:bg-slate-800/50 rounded mt-4"></div>
           <div className="h-6 w-2/3 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
           
           {/* Meta Bar */}
           <div className="flex justify-between items-center py-6 border-t border-b border-slate-200 dark:border-slate-800 mt-8">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
           </div>
       </div>

       {/* Media Skeleton */}
       <div className="w-full aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-sm mb-12"></div>

       {/* Content Skeleton */}
       <div className="space-y-4">
           {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className="space-y-3 mb-8">
                   <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                   <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                   <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                   <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
               </div>
           ))}
       </div>
    </div>
  );
};