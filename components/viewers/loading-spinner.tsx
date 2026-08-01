'use client';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        {/* Spinner */}
        <div className="absolute inset-0">
          <svg
            className="w-full h-full animate-spin"
            style={{
              animationDuration: '3s',
            }}
            viewBox="0 0 50 50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="31.4 94.2"
              opacity="0.7"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d9a441" />
                <stop offset="100%" stopColor="#d9a441" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <p className="text-sm text-porcelain/60">Loading...</p>
    </div>
  );
}
