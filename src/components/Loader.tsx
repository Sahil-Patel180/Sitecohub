import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent shadow-lg"></div>
            </div>
        </div>
    );
};

export default Loader;
