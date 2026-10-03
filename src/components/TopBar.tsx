import type { ReactNode } from 'react';
import { useTheme } from '../lib/theme';
import { ArrowLeftIcon, MoonIcon, SunIcon } from './Icons';

interface Props {
  back?: { href: string; label: string };
  children?: ReactNode;
}

export default function TopBar({ back, children }: Props) {
  const { theme, toggle } = useTheme();
  const nextLabel = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {back ? (
          <a href={back.href} className="back-link">
            <ArrowLeftIcon />
            {back.label}
          </a>
        ) : (
          <a href="#/" className="wordmark" aria-label="PR Challenge, página inicial">
            <span className="wordmark-mark" aria-hidden>
              ±
            </span>
            pr challenge
          </a>
        )}
        <div className="topbar-actions">
          {children}
          <button type="button" className="icon-btn" onClick={toggle} aria-label={nextLabel} title={nextLabel}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
