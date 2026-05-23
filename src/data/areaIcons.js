const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${inner}</svg>`;
export default {
  "NextG Networks & O-RAN": svg(`<circle cx="12" cy="12" r="2.1"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a9.5 9.5 0 0 0 0 14M19 5a9.5 9.5 0 0 1 0 14" stroke-linecap="round"/>`),
  "Cyber Resilience & Zero Trust": svg(`<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>`),
  "Autonomous & Aerial Systems": svg(`<circle cx="5.5" cy="6" r="2"/><circle cx="18.5" cy="6" r="2"/><circle cx="5.5" cy="18" r="2"/><circle cx="18.5" cy="18" r="2"/><rect x="9" y="9.5" width="6" height="5" rx="1.2"/><path d="M7 7.5l2 2M17 7.5l-2 2M7 16.5l2-2M17 16.5l-2-2" stroke-linecap="round"/>`),
  "AI-Driven Network Management": svg(`<rect x="7" y="7" width="10" height="10" rx="2.2"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke-linecap="round"/>`)
};
