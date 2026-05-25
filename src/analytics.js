const WEBSITE_ID = import.meta.env.VITE_UMAMI_CLOUD_WEBSITE_ID?.trim();

const UMAMI_SCRIPT = 'https://cloud.umami.is/script.js';

/** @type {{ name: string; data?: Record<string, string> }[]} */
const queue = [];

function flush() {
  if (!WEBSITE_ID || typeof window.umami?.track !== 'function') return;
  while (queue.length) {
    const { name, data } = queue.shift();
    window.umami.track(name, data);
  }
}

export function initAnalytics() {
  if (!WEBSITE_ID) return;

  if (document.querySelector(`script[data-website-id="${WEBSITE_ID}"]`)) {
    flush();
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SCRIPT;
  script.dataset.websiteId = WEBSITE_ID;
  script.addEventListener('load', flush);
  document.head.appendChild(script);
}

/** @param {string} name @param {Record<string, string> | undefined} data */
export function trackEvent(name, data) {
  if (!WEBSITE_ID) return;
  queue.push({ name, data });
  flush();
}
