const Loader = ({ size = 'medium', text = '' }) => {
    const sizeClasses = {
        small: 'h-8 w-8',
        medium: 'h-16 w-16',
        large: 'h-24 w-24',
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
                <div
                    className={`animate-spin rounded-full ${sizeClasses[size]}`}
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)'
                    }}
                ></div>
                <div
                    className={`absolute top-0 left-0 animate-pulse-glow rounded-full ${sizeClasses[size]}`}
                    style={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)',
                        filter: 'blur(10px)',
                        zIndex: -1
                    }}
                ></div>
            </div>
            {text && <p className="text-gray-600 dark:text-gray-300 text-sm font-medium animate-pulse">{text}</p>}
        </div>
    );
};

export default Loader;

