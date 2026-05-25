const STORAGE_KEY = 'matrix-theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  setTheme(theme, false);

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(next, true);
  });
}

export function setTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) localStorage.setItem(STORAGE_KEY, theme);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-label', theme === 'light' ? '切换到深色模式' : '切换到浅色模式');
    btn.dataset.theme = theme;
  }

  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
