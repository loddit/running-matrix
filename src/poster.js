import { cssVar } from './theme.js';

const SKY = 'var(--color-sky-500)';
const STORAGE_KEY = 'matrix-poster';
export const POSTER_W = 420;
export const POSTER_H = 560;
export const EXPORT_W = 1080;
export const EXPORT_H = 1440;
export const ALL_KEYS = ['easy', 'tempo', 'lsd', 'hill', 'int', 'test'];

const POSTER_LINE_GEOMETRIES = [
  { x1: 420, y1: 0, x2: 0, y2: 309 },
  { x1: 420, y1: 0, x2: 0, y2: 403 },
  { x1: 252, y1: 0, x2: 0, y2: 224 },
  { x1: 420, y1: 168, x2: 42, y2: 560 },
  { x1: 360, y1: 0, x2: 0, y2: 500 },
  { x1: 420, y1: 56, x2: 84, y2: 560 },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

export const TYPES = [
  { k: 'easy', n: '轻松', s: 'EASY', c: SKY },
  { k: 'tempo', n: '节奏', s: 'TEMPO', c: '#FF6B35' },
  { k: 'lsd', n: '长距离', s: 'LSD', cDark: '#00E5FF', cLight: 'var(--color-cyan-600)' },
  { k: 'hill', n: '爬坡', s: 'HILL', c: '#FF3CAC' },
  { k: 'int', n: '间歇', s: 'INT', c: '#C77DFF' },
  { k: 'test', n: '自测', s: 'TEST', c: 'var(--color-green-500)' },
];

function isLightTheme() {
  return document.documentElement.dataset.theme === 'light';
}

function resolveType(t) {
  const c = isLightTheme() && t.cLight ? t.cLight : (t.cDark ?? t.c);
  return {
    c,
    bg: `color-mix(in oklab, ${c} 7%, transparent)`,
    border: `color-mix(in oklab, ${c} 28%, transparent)`,
    bar: c,
  };
}

function posterLineOpacity(index) {
  const n = Math.min(index + 1, 4);
  const v = cssVar(`--poster-line-opacity-${n}`);
  if (index < 4) return v || '0.2';
  const base = parseFloat(cssVar('--poster-line-opacity-4')) || 0.2;
  return String(Math.max(0.08, base - (index - 3) * 0.02));
}

function renderPosterLines() {
  const svg = document.getElementById('poster-lines');
  if (!svg) return;

  svg.replaceChildren();
  const filledKeys = order.filter((key) => (locs[key] ?? '').trim().length > 0);

  filledKeys.forEach((key, i) => {
    const t = typeByKey(key);
    const geom = POSTER_LINE_GEOMETRIES[i];
    if (!t || !geom) return;

    const { c } = resolveType(t);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(geom.x1));
    line.setAttribute('y1', String(geom.y1));
    line.setAttribute('x2', String(geom.x2));
    line.setAttribute('y2', String(geom.y2));
    line.setAttribute('stroke', c);
    line.setAttribute('stroke-width', '0.8');
    line.style.opacity = posterLineOpacity(i);
    svg.appendChild(line);
  });
}

export const locs = {};
export let runnerName = '';
export let order = [];

/** 当前已选训练类型及其地点，用于统计事件参数 */
export function getLocsPayload() {
  const payload = {};
  for (const key of order) {
    const value = (locs[key] ?? '').trim();
    if (value) payload[key] = value;
  }
  return payload;
}

let activeKey = null;
let pendingDeleteKey = null;

let dragState = null;
let suppressRowClick = false;

function defaultState() {
  return {
    order: [...ALL_KEYS],
    locs: Object.fromEntries(ALL_KEYS.map((k) => [k, ''])),
    runnerName: '',
  };
}

function isValidKey(key) {
  return ALL_KEYS.includes(key);
}

function sanitizeOrder(raw) {
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  const next = [];
  for (const key of raw) {
    if (!isValidKey(key) || seen.has(key)) continue;
    seen.add(key);
    next.push(key);
  }
  return next.length > 0 ? next : null;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    const nextOrder = sanitizeOrder(data.order);
    if (!nextOrder) return defaultState();

    const nextLocs = { ...defaultState().locs };
    if (data.locs && typeof data.locs === 'object') {
      for (const key of ALL_KEYS) {
        if (typeof data.locs[key] === 'string') nextLocs[key] = data.locs[key];
      }
    }

    return {
      order: nextOrder,
      locs: nextLocs,
      runnerName: typeof data.runnerName === 'string' ? data.runnerName : '',
    };
  } catch {
    return defaultState();
  }
}

function applyState(state) {
  order = state.order.filter(isValidKey);
  if (order.length === 0) order = [...ALL_KEYS];
  runnerName = state.runnerName;
  for (const key of ALL_KEYS) {
    locs[key] = state.locs[key] ?? '';
  }
}

export function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      order,
      locs: { ...locs },
      runnerName,
    }),
  );
}

applyState(loadState());

function typeByKey(key) {
  return TYPES.find((t) => t.k === key);
}

function availableTypes() {
  const active = new Set(order);
  return TYPES.filter((t) => !active.has(t.k));
}

function openDialog(key) {
  const t = typeByKey(key);
  if (!t || !order.includes(key)) return;

  activeKey = key;
  const dialog = document.getElementById('loc-dialog');
  const label = document.getElementById('loc-dialog-label');
  const title = document.getElementById('loc-dialog-title');
  const input = document.getElementById('loc-dialog-input');

  const colors = resolveType(t);
  label.textContent = t.s;
  label.style.color = colors.c;
  title.textContent = t.n;
  input.value = locs[key] || '';
  dialog.classList.remove('hidden');
  dialog.setAttribute('aria-hidden', 'false');
  input.focus();
  input.select();
}

function closeDialog() {
  activeKey = null;
  const dialog = document.getElementById('loc-dialog');
  dialog.classList.add('hidden');
  dialog.setAttribute('aria-hidden', 'true');
}

function saveDialog() {
  if (!activeKey) return;
  const input = document.getElementById('loc-dialog-input');
  locs[activeKey] = input.value.trim();
  closeDialog();
  saveState();
  renderPoster();
}

function openConfirmDialog(key) {
  const t = typeByKey(key);
  if (!t) return;

  pendingDeleteKey = key;
  const dialog = document.getElementById('confirm-dialog');
  const message = document.getElementById('confirm-dialog-message');
  const loc = locs[key]?.trim();
  message.textContent = loc
    ? `确定删除「${t.n}」的地点「${loc}」吗？`
    : `确定删除「${t.n}」吗？`;
  dialog.classList.remove('hidden');
  dialog.setAttribute('aria-hidden', 'false');
}

function closeConfirmDialog() {
  pendingDeleteKey = null;
  const dialog = document.getElementById('confirm-dialog');
  dialog.classList.add('hidden');
  dialog.setAttribute('aria-hidden', 'true');
}

function confirmDelete() {
  if (!pendingDeleteKey) return;
  order = order.filter((k) => k !== pendingDeleteKey);
  closeConfirmDialog();
  saveState();
  renderPoster();
}

function openAddDialog() {
  const available = availableTypes();
  if (available.length === 0) return;

  const list = document.getElementById('add-dialog-list');
  list.innerHTML = '';
  available.forEach((t) => {
    const { c } = resolveType(t);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-dialog-item';
    btn.dataset.addType = t.k;
    btn.innerHTML = `
      <span class="add-dialog-item-code" style="color:${c}">${t.s}</span>
      <span class="add-dialog-item-name">${t.n}</span>
    `;
    list.appendChild(btn);
  });

  const dialog = document.getElementById('add-dialog');
  dialog.classList.remove('hidden');
  dialog.setAttribute('aria-hidden', 'false');
}

function closeAddDialog() {
  const dialog = document.getElementById('add-dialog');
  dialog.classList.add('hidden');
  dialog.setAttribute('aria-hidden', 'true');
}

function addType(key) {
  if (!isValidKey(key) || order.includes(key) || order.length >= ALL_KEYS.length) return;
  order.push(key);
  closeAddDialog();
  saveState();
  renderPoster();
}

/** 插入到 destIndex 行之前；destIndex === order.length 表示插到末尾 */
function resolveDropDest(fromIndex, destIndex) {
  if (destIndex === fromIndex || destIndex === fromIndex + 1) return fromIndex;
  let insertAt = destIndex;
  if (fromIndex < destIndex) insertAt--;
  return insertAt;
}

function getDropIndex(rowsEl, clientY, dragKey) {
  const rows = [...rowsEl.querySelectorAll('[data-key]')];
  let lastRow = null;

  for (const row of rows) {
    if (row.dataset.key === dragKey) continue;
    const rect = row.getBoundingClientRect();
    lastRow = row;
    if (clientY < rect.top + rect.height / 2) {
      return order.indexOf(row.dataset.key);
    }
  }

  if (lastRow) return order.length;
  return order.indexOf(dragKey);
}

function getRowGap(rowsEl) {
  const rows = rowsEl.querySelectorAll('[data-key]');
  if (rows.length < 2) return 0;
  const first = rows[0].getBoundingClientRect();
  const second = rows[1].getBoundingClientRect();
  return Math.max(0, second.top - first.bottom);
}

function reorderByDrag(fromKey, destIndex) {
  const fromIndex = order.indexOf(fromKey);
  if (fromIndex === -1) return;
  const targetIndex = resolveDropDest(fromIndex, destIndex);
  if (targetIndex === fromIndex) return;
  const next = [...order];
  const [item] = next.splice(fromIndex, 1);
  next.splice(targetIndex, 0, item);
  order = next;
  saveState();
}

function clearDragShifts(rowsEl) {
  rowsEl.querySelectorAll('[data-key]').forEach((row) => {
    row.style.transform = '';
    row.style.transition = '';
  });
}

function updateDragShifts(rowsEl) {
  const fromIndex = order.indexOf(dragState.key);
  const targetIndex = resolveDropDest(fromIndex, dragState.dropIndex);
  if (dragState.lastShiftFrom === fromIndex && dragState.lastShiftTo === targetIndex) return;
  dragState.lastShiftFrom = fromIndex;
  dragState.lastShiftTo = targetIndex;

  const h = dragState.shiftPx;
  rowsEl.querySelectorAll('[data-key]').forEach((row) => {
    const idx = order.indexOf(row.dataset.key);
    if (row.dataset.key === dragState.key) return;

    let ty = 0;
    if (fromIndex < targetIndex && idx > fromIndex && idx <= targetIndex) ty = -h;
    else if (fromIndex > targetIndex && idx >= targetIndex && idx < fromIndex) ty = h;

    row.style.transform = ty ? `translateY(${ty}px)` : '';
  });
}

function getLandingRect(rowsEl, fromIndex, toIndex) {
  const rows = [...rowsEl.querySelectorAll('[data-key]')];
  const sourceRow = rows[fromIndex];
  if (!sourceRow) return null;
  if (fromIndex === toIndex) return sourceRow.getBoundingClientRect();

  const targetRow = rows[toIndex];
  if (!targetRow) return sourceRow.getBoundingClientRect();
  return targetRow.getBoundingClientRect();
}

function startDragAnimation(rowsEl, row, e) {
  const rect = row.getBoundingClientRect();
  const ghost = row.cloneNode(true);
  ghost.classList.add('poster-row-ghost');
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);

  row.classList.add('poster-row--placeholder');
  rowsEl.classList.add('poster-rows--drag-active');
  setPageDragLock(true);

  dragState.ghost = ghost;
  dragState.offsetY = e.clientY - rect.top;
  dragState.offsetX = e.clientX - rect.left;
  dragState.shiftPx = rect.height + getRowGap(rowsEl);
  dragState.dropIndex = order.indexOf(row.dataset.key) + 1;
  dragState.lastShiftFrom = -1;
  dragState.lastShiftTo = -1;
}

function moveGhost(e) {
  if (!dragState?.ghost) return;
  dragState.ghost.style.left = `${e.clientX - dragState.offsetX}px`;
  dragState.ghost.style.top = `${e.clientY - dragState.offsetY}px`;
}

const DRAG_MOVE_OPTS = { passive: false, capture: true };

let dragDocListenersBound = false;
let dragRowsEl = null;

function dragThreshold(pointerType) {
  return pointerType === 'touch' ? 4 : 6;
}

function setPageDragLock(on) {
  document.body.classList.toggle('poster-dragging', on);
}

function releasePointerCaptureSafe(handle, pointerId) {
  if (!handle?.hasPointerCapture?.(pointerId)) return;
  try {
    handle.releasePointerCapture(pointerId);
  } catch {
    /* already released on some touch browsers */
  }
}

function bindDragDocListeners(rowsEl) {
  if (dragDocListenersBound) return;
  dragDocListenersBound = true;
  dragRowsEl = rowsEl;
  document.addEventListener('pointermove', onDragPointerMove, DRAG_MOVE_OPTS);
  document.addEventListener('pointerup', onDragPointerEnd);
  document.addEventListener('pointercancel', onDragPointerEnd);
}

function unbindDragDocListeners() {
  if (!dragDocListenersBound) return;
  dragDocListenersBound = false;
  dragRowsEl = null;
  document.removeEventListener('pointermove', onDragPointerMove, DRAG_MOVE_OPTS);
  document.removeEventListener('pointerup', onDragPointerEnd);
  document.removeEventListener('pointercancel', onDragPointerEnd);
}

function onDragPointerMove(e) {
  if (!dragState || !dragRowsEl || e.pointerId !== dragState.pointerId) return;
  if (e.cancelable) e.preventDefault();

  if (!dragState.moved && Math.abs(e.clientY - dragState.startY) > dragThreshold(e.pointerType)) {
    dragState.moved = true;
    startDragAnimation(dragRowsEl, dragState.row, e);
  }

  if (!dragState.moved) return;

  moveGhost(e);
  dragState.dropIndex = getDropIndex(dragRowsEl, e.clientY, dragState.key);
  updateDragShifts(dragRowsEl);
}

function onDragPointerEnd(e) {
  if (!dragState || !dragRowsEl || e.pointerId !== dragState.pointerId) return;

  const rowsEl = dragRowsEl;
  const { key, row, handle, moved, ghost } = dragState;
  unbindDragDocListeners();

  if (!moved) {
    cleanupDrag(rowsEl, row, handle, e);
    return;
  }

  suppressRowClick = true;
  const fromIndex = order.indexOf(key);
  const destIndex = getDropIndex(rowsEl, e.clientY, key);
  const targetIndex = resolveDropDest(fromIndex, destIndex);
  const landing = getLandingRect(rowsEl, fromIndex, targetIndex);

  const finish = () => {
    reorderByDrag(key, destIndex);
    cleanupDrag(rowsEl, row, handle, e);
    renderPoster();
  };

  if (ghost && landing) {
    ghost.style.transition =
      'top 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.24s ease, box-shadow 0.24s ease, opacity 0.24s ease';
    ghost.style.left = `${landing.left}px`;
    ghost.style.top = `${landing.top}px`;
    ghost.style.width = `${landing.width}px`;
    ghost.style.height = `${landing.height}px`;
    ghost.style.transform = 'scale(1)';
    ghost.style.opacity = '1';

    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      finish();
    };
    ghost.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, 280);
  } else {
    finish();
  }
}

function cleanupDrag(rowsEl, row, handle, e, removeGhost = true) {
  unbindDragDocListeners();
  if (dragState?.ghost && removeGhost) dragState.ghost.remove();
  row?.classList.remove('poster-row--placeholder');
  rowsEl.classList.remove('poster-rows--drag-active');
  clearDragShifts(rowsEl);
  if (e) releasePointerCaptureSafe(handle, e.pointerId);
  setPageDragLock(false);
  dragState = null;
}

function initRowDrag(rowsEl) {
  rowsEl.addEventListener(
    'pointerdown',
    (e) => {
      const handle = e.target.closest('[data-drag-handle]');
      if (!handle) return;

      const row = handle.closest('[data-key]');
      if (!row) return;

      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.preventDefault();
      bindDragDocListeners(rowsEl);
      handle.setPointerCapture(e.pointerId);
      dragState = {
        key: row.dataset.key,
        pointerId: e.pointerId,
        row,
        handle,
        startY: e.clientY,
        moved: false,
      };

      handle.addEventListener(
        'lostpointercapture',
        (ev) => {
          if (dragState?.pointerId === ev.pointerId) onDragPointerEnd(ev);
        },
        { once: true },
      );
    },
    { passive: false },
  );
}

function renderRow(key, index, rowsEl, v) {
  const t = typeByKey(key);
  if (!t) return;

  const loc = locs[key] || '';
  const hasLoc = loc.trim().length > 0;
  const { c, bg, border, bar } = resolveType(t);
  const row = document.createElement('div');
  row.className = 'poster-row flex items-center relative overflow-hidden shrink-0';
  row.dataset.key = key;
  row.style.cssText = `border:0.5px solid ${border};background:${bg}`;
  row.innerHTML = `
    <div class="poster-row-bar" style="background:${bar}"></div>
    <div class="poster-row-handle" data-drag-handle aria-label="拖动排序">
      <div class="poster-row-index" style="color:${c}">${String(index + 1).padStart(2, '0')}</div>
      <div class="poster-row-handle-divider"></div>
    </div>
    <div class="poster-row-label-col">
      <span class="poster-row-label-en" style="color:${c}">${t.s}</span>
      <span class="poster-row-label-cn" style="color:${c}">${t.n}</span>
    </div>
    <div class="poster-row-col-divider"></div>
    <div class="poster-row-loc">
      ${
        hasLoc
          ? `<span class="poster-row-loc-text" style="color:${v('--row-loc-text')}">${loc}</span>`
          : `<span class="poster-row-loc-placeholder" style="color:${c};opacity:0.27">_ _ _ _</span>`
      }
    </div>
    <button type="button" class="poster-row-delete" style="--row-accent:${c}" data-delete="${key}" aria-label="删除 ${t.n}">×</button>
  `;
  rowsEl.appendChild(row);
}

export function initPoster() {
  const rowsEl = document.getElementById('poster-rows');
  initRowDrag(rowsEl);

  rowsEl.addEventListener('click', (e) => {
    if (suppressRowClick) {
      suppressRowClick = false;
      return;
    }
    if (e.target.closest('[data-drag-handle]')) return;

    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      e.stopPropagation();
      openConfirmDialog(deleteBtn.dataset.delete);
      return;
    }
    const addRow = e.target.closest('[data-add-row]');
    if (addRow) {
      openAddDialog();
      return;
    }
    const row = e.target.closest('[data-key]');
    if (row) openDialog(row.dataset.key);
  });

  const addDialog = document.getElementById('add-dialog');
  addDialog?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-add-type]');
    if (item) addType(item.dataset.addType);
  });
  document.getElementById('add-dialog-cancel')?.addEventListener('click', closeAddDialog);
  addDialog?.querySelectorAll('[data-add-close]').forEach((el) => {
    el.addEventListener('click', closeAddDialog);
  });

  const dialog = document.getElementById('loc-dialog');
  document.getElementById('loc-dialog-save')?.addEventListener('click', saveDialog);
  document.getElementById('loc-dialog-cancel')?.addEventListener('click', closeDialog);
  dialog?.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', closeDialog);
  });

  document.getElementById('loc-dialog-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveDialog();
    if (e.key === 'Escape') closeDialog();
  });

  const confirmDialog = document.getElementById('confirm-dialog');
  document.getElementById('confirm-dialog-ok')?.addEventListener('click', confirmDelete);
  document.getElementById('confirm-dialog-cancel')?.addEventListener('click', closeConfirmDialog);
  confirmDialog?.querySelectorAll('[data-confirm-close]').forEach((el) => {
    el.addEventListener('click', closeConfirmDialog);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (activeKey) closeDialog();
    if (pendingDeleteKey) closeConfirmDialog();
    if (!document.getElementById('add-dialog')?.classList.contains('hidden')) closeAddDialog();
  });
}

export function renderPoster() {
  const v = cssVar;
  const name = runnerName.toUpperCase();

  const rowsEl = document.getElementById('poster-rows');
  rowsEl.innerHTML = '';
  order.forEach((key, i) => renderRow(key, i, rowsEl, v));

  if (order.length < ALL_KEYS.length) {
    const addRow = document.createElement('button');
    addRow.type = 'button';
    addRow.className = 'poster-row-add w-full';
    addRow.dataset.addRow = '1';
    addRow.setAttribute('aria-label', '添加训练类型');
    addRow.textContent = '+';
    rowsEl.appendChild(addRow);
  }

  const dotsEl = document.getElementById('footer-dots');
  dotsEl.innerHTML = '';
  order.forEach((key) => {
    const t = typeByKey(key);
    if (!t) return;
    const { c } = resolveType(t);
    const dot = document.createElement('div');
    dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:${c};opacity:.85`;
    dotsEl.appendChild(dot);
  });

  document.getElementById('footer-name').textContent = name ? name.slice(0, 18) : '';
  renderPosterLines();
}
