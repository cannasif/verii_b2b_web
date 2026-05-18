import { type ReactElement } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Footer(): ReactElement {
  return (
    <footer className="pointer-events-none fixed bottom-0 right-0 z-30">
      <div className="pointer-events-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
