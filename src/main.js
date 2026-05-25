import './style.css';
import { initExport } from './export.js';
import { initPoster, renderPoster } from './poster.js';
import { initTheme } from './theme.js';

initTheme();
initExport();
initPoster();
renderPoster();
window.addEventListener('themechange', renderPoster);
