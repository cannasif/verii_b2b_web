interface AuthBackgroundProps {
  isActive: boolean;
  isPaused?: boolean;
}

export const AuthBackground = ({ isActive, isPaused = false }: AuthBackgroundProps) => {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
        isActive ? 'opacity-100' : 'opacity-0'
      } ${isPaused ? 'wms-bg-paused' : ''}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(34,211,238,0.2),transparent_42%),radial-gradient(circle_at_82%_76%,rgba(59,130,246,0.15),transparent_46%),linear-gradient(180deg,#050d22_0%,#070f27_55%,#030916_100%)]" />
      <div className="wms-bg-noise absolute inset-0" />
      <div className="wms-bg-aisles absolute inset-0" />
      <div className="wms-bg-grid-perspective absolute inset-0" />
      <div className="wms-bg-scan absolute inset-0" />
      <div className="wms-bg-conveyor absolute inset-0" />
      <div className="wms-bg-data-lines absolute inset-0" />
      <div className="wms-bg-floating-icons absolute inset-0">
        <div className="wms-float-icon wms-float-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-cyan-400/20">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <div className="wms-float-icon wms-float-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-blue-400/15">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M12 11v6M9 14h6" />
          </svg>
        </div>
        <div className="wms-float-icon wms-float-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-cyan-400/18">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className="wms-float-icon wms-float-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-blue-400/12">
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div className="wms-float-icon wms-float-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-cyan-400/15">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
          </svg>
        </div>
      </div>
      <div className="wms-bg-vignette absolute inset-0" />
    </div>
  );
};
