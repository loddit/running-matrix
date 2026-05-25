import { snapdom } from '@zumer/snapdom';
import { EXPORT_H, EXPORT_W, locs, order } from './poster.js';

const FILL_REQUIRED_MSG = '请填写完所有项目，不需要的可以删除。';

function isAllFilled() {
  return order.length > 0 && order.every((key) => (locs[key] ?? '').trim().length > 0);
}

function isAlertOpen() {
  return !document.getElementById('alert-dialog')?.classList.contains('hidden');
}

export function openAlertDialog(message, title = '无法下载') {
  const dialog = document.getElementById('alert-dialog');
  document.getElementById('alert-dialog-title').textContent = title;
  document.getElementById('alert-dialog-message').textContent = message;
  dialog?.classList.remove('hidden');
  dialog?.setAttribute('aria-hidden', 'false');
  document.getElementById('alert-dialog-ok')?.focus();
}

export function closeAlertDialog() {
  const dialog = document.getElementById('alert-dialog');
  dialog?.classList.add('hidden');
  dialog?.setAttribute('aria-hidden', 'true');
}

function waitFrames(n = 2) {
  return new Promise((resolve) => {
    let left = n;
    const tick = () => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function downloadPoster() {
  const poster = document.getElementById('poster');
  const btn = document.getElementById('download-poster');
  if (!poster || btn?.disabled) return;

  if (!isAllFilled()) {
    openAlertDialog(FILL_REQUIRED_MSG);
    return;
  }

  btn.disabled = true;
  poster.classList.add('poster-export-mode');

  try {
    await waitFrames();
    await snapdom.download(poster, {
      format: 'png',
      filename: 'running-matrix.png',
      width: EXPORT_W,
      height: EXPORT_H,
      backgroundColor: getComputedStyle(poster).backgroundColor,
    });
  } finally {
    poster.classList.remove('poster-export-mode');
    btn.disabled = false;
  }
}

export function initExport() {
  const alertDialog = document.getElementById('alert-dialog');
  document.getElementById('alert-dialog-ok')?.addEventListener('click', closeAlertDialog);
  alertDialog?.querySelectorAll('[data-alert-close]').forEach((el) => {
    el.addEventListener('click', closeAlertDialog);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isAlertOpen()) closeAlertDialog();
  });

  document.getElementById('download-poster')?.addEventListener('click', () => {
    downloadPoster().catch((err) => {
      console.error('Poster export failed:', err);
    });
  });
}
