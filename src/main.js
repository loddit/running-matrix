import './style.css';
import { initAnalytics } from './analytics.js';
import { initExport } from './export.js';
import { initPoster, renderPoster } from './poster.js';
import { initTheme } from './theme.js';

initAnalytics();
initTheme();
initExport();
initPoster();
renderPoster();
window.addEventListener('themechange', renderPoster);
