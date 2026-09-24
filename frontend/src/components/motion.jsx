import { useEffect } from 'react';
// No entrance/scroll animations: the UI is intentionally calm and static.
// Meters are still filled so progress/score bars render their real values instantly.
export function useReveal(dep = []) {
  useEffect(() => {
    document.querySelectorAll('.rv-meter > i').forEach((el) => {
      el.style.width = el.dataset.w || '70%';
    });
  }, dep);
}