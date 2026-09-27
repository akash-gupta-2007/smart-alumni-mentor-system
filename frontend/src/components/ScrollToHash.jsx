import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// React Router changes the URL hash but never scrolls — this fixes
// navbar links (/#modules, /#demo) and scrolls to top on page change.
// Page changes land instantly (no auto-scroll animation to the header);
// only intentional in-page hash clicks smooth-scroll.
export default function ScrollToHash() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, search]);
  return null;
}
