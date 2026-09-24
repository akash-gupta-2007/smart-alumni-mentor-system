import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
// One reveal system: every .rv fades/slides in; meters fill; stagger groups
export function useReveal(dep = []) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.rv').forEach((el) => {
        gsap.fromTo(el, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.utils.toArray('.rv-meter > i').forEach((el) => {
        const w = el.dataset.w || '70%';
        ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => { el.style.width = w; } });
      });
    });
    return () => ctx.revert();
    // eslint-disable-next-line
  }, dep);
}
