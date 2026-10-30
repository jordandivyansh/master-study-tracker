import { useState, useEffect } from 'react';

export const THEMES = [
  { id: 'system', name: 'System', icon: '🌓', desc: 'Auto-adapts to OS mode' },
  { id: 'dark', name: 'Studio Dark', icon: '🌌', desc: 'Classic Navy & Gold' },
  { id: 'light', name: 'Clean Light', icon: '☀️', desc: 'Ivory Academic Paper' },
  { id: 'midnight', name: 'Midnight OLED', icon: '🌑', desc: 'Pure Pitch Black' },
  { id: 'forest', name: 'Forest Emerald', icon: '🌲', desc: 'Deep Pine & Sage' },
  { id: 'amber', name: 'Warm Amber', icon: '☕', desc: 'Sepia Night Focus' },
];

export function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function getInitialTheme() {
  return localStorage.getItem('study-tracker-theme') || 'system';
}

export default function ThemeSelector({ compact = false }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('study-tracker-theme', theme);
  }, [theme]);

  if (compact) {
    return (
      <div className="theme-compact-wrap">
        <label htmlFor="theme-select" className="theme-compact-label">
          <span className="theme-icon">🎨</span>
          <span className="sr-only">Theme</span>
        </label>
        <select
          id="theme-select"
          className="theme-select-input"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          title="Change Color Theme"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="theme-grid">
      {THEMES.map((t) => {
        const isCurrent = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            className={`theme-card ${isCurrent ? 'active' : ''} theme-card-${t.id}`}
            onClick={() => setTheme(t.id)}
            aria-pressed={isCurrent}
          >
            <div className="theme-card-head">
              <span className="theme-card-icon">{t.icon}</span>
              <span className="theme-card-name">{t.name}</span>
              {isCurrent && <span className="theme-active-tag">Active</span>}
            </div>
            <p className="theme-card-desc">{t.desc}</p>
            <div className="theme-swatches" aria-hidden="true">
              <span className="swatch sw-bg" />
              <span className="swatch sw-card" />
              <span className="swatch sw-accent" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
