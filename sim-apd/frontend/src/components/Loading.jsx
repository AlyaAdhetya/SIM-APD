export function LoadingPage({ label = 'Memuat data...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0' }}>
      
      <svg
        aria-label="loader being flipped clockwise and circled by three white curves fading in and out"
        role="img"
        height="56px"
        width="56px"
        viewBox="0 0 56 56"
        className="loader-hourglass"
      >
        <clipPath id="sand-mound-top">
          <path
            d="M 14.613 13.087 C 15.814 12.059 19.3 8.039 20.3 6.539 C 21.5 4.789 21.5 2.039 21.5 2.039 L 3 2.039 C 3 2.039 3 4.789 4.2 6.539 C 5.2 8.039 8.686 12.059 9.887 13.087 C 11 14.039 12.25 14.039 12.25 14.039 C 12.25 14.039 13.5 14.039 14.613 13.087 Z"
            className="loader__sand-mound-top"
          ></path>
        </clipPath>
        <clipPath id="sand-mound-bottom">
          <path
            d="M 14.613 20.452 C 15.814 21.48 19.3 25.5 20.3 27 C 21.5 28.75 21.5 31.5 21.5 31.5 L 3 31.5 C 3 31.5 3 28.75 4.2 27 C 5.2 25.5 8.686 21.48 9.887 20.452 C 11 19.5 12.25 19.5 12.25 19.5 C 12.25 19.5 13.5 19.5 14.613 20.452 Z"
            className="loader__sand-mound-bottom"
          ></path>
        </clipPath>
        <g transform="translate(2,2)">
          <g
            transform="rotate(-90,26,26)"
            strokeLinecap="round"
            strokeDashoffset="153.94"
            strokeDasharray="153.94 153.94"
            stroke="var(--slate-800)"
            fill="none"
          >
            <circle
              transform="rotate(0,26,26)"
              r="24.5"
              cy="26"
              cx="26"
              strokeWidth="2.5"
              className="loader__motion-thick"
            ></circle>
            <circle
              transform="rotate(90,26,26)"
              r="24.5"
              cy="26"
              cx="26"
              strokeWidth="1.75"
              className="loader__motion-medium"
            ></circle>
            <circle
              transform="rotate(180,26,26)"
              r="24.5"
              cy="26"
              cx="26"
              strokeWidth="1"
              className="loader__motion-thin"
            ></circle>
          </g>
          <g transform="translate(13.75,9.25)" className="loader__model">
            <path
              d="M 1.5 2 L 23 2 C 23 2 22.5 8.5 19 12 C 16 15.5 13.5 13.5 13.5 16.75 C 13.5 20 16 18 19 21.5 C 22.5 25 23 31.5 23 31.5 L 1.5 31.5 C 1.5 31.5 2 25 5.5 21.5 C 8.5 18 11 20 11 16.75 C 11 13.5 8.5 15.5 5.5 12 C 2 8.5 1.5 2 1.5 2 Z"
              fill="rgba(212, 175, 55, 0.15)"
            ></path>

            <g strokeLinecap="round" stroke="var(--primary-color)">
              <line
                y2="20.75"
                x2="12"
                y1="15.75"
                x1="12"
                strokeDasharray="0.25 33.75"
                strokeWidth="1"
                className="loader__sand-grain-left"
              ></line>
              <line
                y2="21.75"
                x2="12.5"
                y1="16.75"
                x1="12.5"
                strokeDasharray="0.25 33.75"
                strokeWidth="1"
                className="loader__sand-grain-right"
              ></line>
              <line
                y2="31.5"
                x2="12.25"
                y1="18"
                x1="12.25"
                strokeDasharray="0.5 107.5"
                strokeWidth="1"
                className="loader__sand-drop"
              ></line>
              <line
                y2="31.5"
                x2="12.25"
                y1="14.75"
                x1="12.25"
                strokeDasharray="54 54"
                strokeWidth="1.5"
                className="loader__sand-fill"
              ></line>
              <line
                y2="31.5"
                x2="12"
                y1="16"
                x1="12"
                strokeDasharray="1 107"
                strokeWidth="1"
                stroke="var(--primary-color)"
                className="loader__sand-line-left"
              ></line>
              <line
                y2="31.5"
                x2="12.5"
                y1="16"
                x1="12.5"
                strokeDasharray="12 96"
                strokeWidth="1"
                stroke="var(--primary-color)"
                className="loader__sand-line-right"
              ></line>

              <g strokeWidth="0" fill="var(--primary-color)">
                <path
                  d="M 12.25 15 L 15.392 13.486 C 21.737 11.168 22.5 2 22.5 2 L 2 2.013 C 2 2.013 2.753 11.046 9.009 13.438 L 12.25 15 Z"
                  clipPath="url(#sand-mound-top)"
                ></path>
                <path
                  d="M 12.25 18.5 L 15.392 20.014 C 21.737 22.332 22.5 31.5 22.5 31.5 L 2 31.487 C 2 31.487 2.753 22.454 9.009 20.062 Z"
                  clipPath="url(#sand-mound-bottom)"
                ></path>
              </g>
            </g>

            <g strokeWidth="2" strokeLinecap="round" opacity="0.7" fill="none">
              <path
                d="M 19.437 3.421 C 19.437 3.421 19.671 6.454 17.914 8.846 C 16.157 11.238 14.5 11.5 14.5 11.5"
                stroke="rgba(255,255,255,0.8)"
                className="loader__glare-top"
              ></path>
              <path
                transform="rotate(180,12.25,16.75)"
                d="M 19.437 3.421 C 19.437 3.421 19.671 6.454 17.914 8.846 C 16.157 11.238 14.5 11.5 14.5 11.5"
                stroke="rgba(255,255,255,0)"
                className="loader__glare-bottom"
              ></path>
            </g>

            <rect height="2" width="24.5" fill="#0f172a"></rect>
            <rect
              height="1"
              width="19.5"
              y="0.5"
              x="2.5"
              ry="0.5"
              rx="0.5"
              fill="#1e293b"
            ></rect>
            <rect
              height="2"
              width="24.5"
              y="31.5"
              fill="#0f172a"
            ></rect>
            <rect
              height="1"
              width="19.5"
              y="32"
              x="2.5"
              ry="0.5"
              rx="0.5"
              fill="#1e293b"
            ></rect>
          </g>
        </g>
      </svg>
      
      <span style={{ color: 'var(--gray-600)', fontSize: 13.5, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export function ButtonSpinner() {
  return (
    <div className="dot-spinner">
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
      <div className="dot-spinner__dot"></div>
    </div>
  );
}

// ===== SKELETON (PHANTOM UI) COMPONENTS =====

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="skeleton skeleton-title" style={{ width: '25%' }} />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th><div className="skeleton skeleton-text" style={{ width: '60px', marginBottom: 0 }} /></th>
              <th><div className="skeleton skeleton-text" style={{ width: '120px', marginBottom: 0 }} /></th>
              <th><div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: 0 }} /></th>
              <th><div className="skeleton skeleton-text" style={{ width: '80px', marginBottom: 0 }} /></th>
              <th><div className="skeleton skeleton-text" style={{ width: '90px', marginBottom: 0 }} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton skeleton-text" style={{ width: '40px', marginBottom: 0 }} /></td>
                <td>
                  <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 6 }} />
                  <div className="skeleton skeleton-text" style={{ width: '50%', height: 10, marginBottom: 0 }} />
                </td>
                <td><div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 0 }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: '50px', borderRadius: 12, height: 24, marginBottom: 0 }} /></td>
                <td><div style={{ display: 'flex', gap: 8 }}><div className="skeleton skeleton-avatar" style={{ width: 32, height: 32 }} /><div className="skeleton skeleton-avatar" style={{ width: 32, height: 32 }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div>
      <div className="skeleton skeleton-title" style={{ width: '30%', height: 28, marginBottom: 6 }} />
      <div className="skeleton skeleton-text" style={{ width: '20%', height: 14, marginBottom: 24 }} />
      
      <div className="stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skeleton-card" key={i}>
            <div className="skeleton skeleton-text" style={{ width: '50%', height: 12 }} />
            <div className="skeleton skeleton-title" style={{ width: '40%', height: 32, margin: 0 }} />
          </div>
        ))}
      </div>

      <div className="dashboard-row">
        <SkeletonTable rows={4} />
        <div className="skeleton-card" style={{ marginTop: 16 }}>
          <div className="skeleton skeleton-title" style={{ width: '60%' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div className="skeleton skeleton-avatar" style={{ width: 40, height: 40 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 6 }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', height: 10, marginBottom: 0 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCardList({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton skeleton-title" style={{ width: '50%', height: 24, marginBottom: 8 }} />
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i} style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="skeleton skeleton-text" style={{ width: '60%', height: 16, marginBottom: 0 }} />
            <div className="skeleton skeleton-text" style={{ width: '20%', height: 12, borderRadius: 12, marginBottom: 0 }} />
          </div>
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}
