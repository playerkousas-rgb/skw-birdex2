import React from 'react';
import { LayoutGrid, ScanLine, Images, User } from 'lucide-react';
import { View } from '../types';

interface NavbarProps {
  current: View;
  onNavigate: (v: View) => void;
}

const ITEMS: { key: View; label: string; icon: React.ElementType }[] = [
  { key: 'dex', label: '圖鑑', icon: LayoutGrid },
  { key: 'scanner', label: '捕捉', icon: ScanLine },
  { key: 'album', label: '收藏', icon: Images },
  { key: 'profile', label: '訓練師', icon: User },
];

export function Navbar({ current, onNavigate }: NavbarProps) {
  return (
    <nav className="shrink-0 h-20 bg-dex-surface border-t border-dex-border flex items-center justify-around px-2 pb-2 z-50 select-none">
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const active = current === key;
        const isScan = key === 'scanner';
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
              active ? 'text-dex-neon' : 'text-dex-muted hover:text-white'
            }`}
          >
            {isScan && active && (
              <span className="absolute -top-1 w-12 h-12 rounded-full bg-dex-neon/10 blur-md" />
            )}
            <Icon size={isScan ? 32 : 24} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] font-bold tracking-wider ${active ? 'text-dex-neon' : 'text-dex-muted'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
