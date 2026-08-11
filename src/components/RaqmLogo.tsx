interface RaqmLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightMode?: boolean;
}

export function RaqmLogo({ className = '', size = 'md', showText = true, lightMode = false }: RaqmLogoProps) {
  // Height and Width dimensions according to size
  const iconSizes = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const primaryColor = lightMode ? '#ffffff' : '#0F172A'; // Dark Navy or White
  const cyanColor = '#38BDF8'; // Bright Sky Blue from attached logo

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`} dir="rtl">
      {/* Brand Text 'رَقْم' */}
      {showText && (
        <div className="flex flex-col items-end">
          <span
            className={`font-black tracking-tight ${textSizes[size]}`}
            style={{
              color: primaryColor,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            رَقْم
          </span>
        </div>
      )}

      {/* Grid Icon matching the attached logo */}
      <svg
        className={`${iconSizes[size]} aspect-square shrink-0`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Rounded Container */}
        <rect x="2" y="2" width="96" height="96" rx="26" fill={primaryColor} />

        {/* 2x2 Grid Squares */}
        {/* Top-Left Tile (Dark Navy or Accent) */}
        <rect x="14" y="14" width="32" height="32" rx="8" fill={primaryColor} />
        {/* Top-Right Tile (Cyan Blue) */}
        <rect x="54" y="14" width="32" height="32" rx="8" fill={cyanColor} />
        {/* Bottom-Left Tile (Cyan Blue) */}
        <rect x="14" y="54" width="32" height="32" rx="8" fill={cyanColor} />
        {/* Bottom-Right Tile (White/Navy) */}
        <rect x="54" y="54" width="32" height="32" rx="8" fill={lightMode ? '#0F172A' : '#ffffff'} />
      </svg>
    </div>
  );
}
