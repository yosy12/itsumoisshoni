import type { Theme } from '../types';

export interface ThemePalette {
  id: Theme;
  label: string;
  desc: string;
  emoji: string;
  bgGradient: string;
  headerText: string;
  subText: string;
  accentBg: string;
  accentBgHover: string;
  accentText: string;
  border: string;
  actionHover: string;
  swatch: string;
}

const seasonalPalette = (): ThemePalette => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return {
      id: 'seasonal', label: '季節感（春）', desc: '桜色のやさしい春の雰囲気', emoji: '🌸',
      bgGradient: 'from-pink-200 via-rose-50 to-green-50',
      headerText: 'text-rose-900', subText: 'text-rose-700/70',
      accentBg: 'bg-rose-400', accentBgHover: 'hover:bg-rose-500', accentText: 'text-rose-800',
      border: 'border-rose-200', actionHover: 'hover:bg-rose-50 hover:border-rose-200',
      swatch: 'bg-gradient-to-br from-pink-300 to-green-100',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      id: 'seasonal', label: '季節感（夏）', desc: '水色が涼しい夏の雰囲気', emoji: '🌊',
      bgGradient: 'from-sky-300 via-cyan-50 to-blue-50',
      headerText: 'text-sky-900', subText: 'text-sky-700/70',
      accentBg: 'bg-sky-500', accentBgHover: 'hover:bg-sky-600', accentText: 'text-sky-800',
      border: 'border-sky-200', actionHover: 'hover:bg-sky-50 hover:border-sky-200',
      swatch: 'bg-gradient-to-br from-sky-300 to-cyan-100',
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      id: 'seasonal', label: '季節感（秋）', desc: '紅葉色があたたかい秋の雰囲気', emoji: '🍂',
      bgGradient: 'from-orange-300 via-amber-100 to-yellow-50',
      headerText: 'text-orange-900', subText: 'text-orange-700/70',
      accentBg: 'bg-orange-500', accentBgHover: 'hover:bg-orange-600', accentText: 'text-orange-800',
      border: 'border-orange-200', actionHover: 'hover:bg-orange-50 hover:border-orange-200',
      swatch: 'bg-gradient-to-br from-orange-300 to-amber-100',
    };
  }
  return {
    id: 'seasonal', label: '季節感（冬）', desc: '雪色が澄んだ冬の雰囲気', emoji: '❄️',
    bgGradient: 'from-indigo-200 via-blue-50 to-white',
    headerText: 'text-indigo-900', subText: 'text-indigo-700/70',
    accentBg: 'bg-indigo-500', accentBgHover: 'hover:bg-indigo-600', accentText: 'text-indigo-800',
    border: 'border-indigo-200', actionHover: 'hover:bg-indigo-50 hover:border-indigo-200',
    swatch: 'bg-gradient-to-br from-indigo-300 to-blue-100',
  };
};

// 「季節感」だけは今日の月に応じて中身が変わる（テーマ一覧に出す説明・スウォッチ用）。
export const THEMES: Record<Theme, ThemePalette> = {
  warm: {
    id: 'warm', label: 'あたたかみ', desc: '橙色がやさしいあたたかな雰囲気', emoji: '🧡',
    bgGradient: 'from-orange-200 via-amber-100 to-yellow-50',
    headerText: 'text-amber-900', subText: 'text-amber-700/70',
    accentBg: 'bg-amber-500', accentBgHover: 'hover:bg-amber-600', accentText: 'text-amber-800',
    border: 'border-amber-200', actionHover: 'hover:bg-amber-50 hover:border-amber-200',
    swatch: 'bg-gradient-to-br from-orange-300 to-amber-100',
  },
  calm: {
    id: 'calm', label: 'おちつき', desc: '緑と青みがやすらぐ落ち着いた雰囲気', emoji: '🌿',
    bgGradient: 'from-slate-200 via-sky-50 to-emerald-50',
    headerText: 'text-slate-800', subText: 'text-slate-600/70',
    accentBg: 'bg-emerald-500', accentBgHover: 'hover:bg-emerald-600', accentText: 'text-slate-700',
    border: 'border-slate-200', actionHover: 'hover:bg-slate-50 hover:border-slate-200',
    swatch: 'bg-gradient-to-br from-slate-300 to-emerald-100',
  },
  get seasonal() {
    return seasonalPalette();
  },
};

export const getThemePalette = (theme: Theme): ThemePalette => THEMES[theme];
