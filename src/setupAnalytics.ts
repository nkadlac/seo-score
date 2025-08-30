// Dynamically load Fathom if a site ID is provided
const siteId = import.meta.env.VITE_FATHOM_SITE_ID as string | undefined;

if (siteId && typeof document !== 'undefined') {
  const existing = document.querySelector('script[src*="usefathom.com"]');
  if (!existing) {
    const script = document.createElement('script');
    script.src = 'https://cdn.usefathom.com/script.js';
    script.setAttribute('data-site', siteId);
    script.defer = true;
    document.head.appendChild(script);
  }
}

