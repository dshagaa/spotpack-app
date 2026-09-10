export const THEME_STORAGE_KEY = 'spotpack-theme';

export const THEME_MODES = [
  { value: 'day', label: 'Day', description: 'Always use the light theme' },
  { value: 'night', label: 'Night', description: 'Always use the dark theme' },
  { value: 'system', label: 'System', description: 'Follow your device preference' }
];

export function getSystemPrefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(mode) {
  if (typeof document === 'undefined') return;

  const isDark = mode === 'night' || (mode === 'system' && getSystemPrefersDark());
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = mode;
}
