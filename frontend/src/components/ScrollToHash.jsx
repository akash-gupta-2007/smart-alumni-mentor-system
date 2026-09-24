import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// React Router changes the URL hash but never scrolls — this fixes
// navbar links (/#modules, /#demo) and scrolls to top on page change.
export default function ScrollToHash() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, hash, search]);
  return null;
}
