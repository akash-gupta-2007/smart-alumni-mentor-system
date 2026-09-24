// MentorSetu icon set — consistent 1.8 stroke, currentColor, inherits size.
// Replaces emoji glyphs across the UI (professional, themeable, token-driven).
const S = (props) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: props.size || 18,
  height: props.size || 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
  ...props
});
export const IconSprout = (p) => (
  <svg {...S(p)}><path d="M7 20h10M10 20c0-5.5 2.5-9 8-11-1.2 5.5-4 9-8 11Z" /><path d="M4 9c0-4 3-6 7-6 1.2 4-1 6-4.5 6H4Z" /></svg>
);
export const IconCalendar = (p) => (
  <svg {...S(p)}><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M16 2.5v4M8 2.5v4M3 10.5h18" /></svg>
);
export const IconGauge = (p) => (
  <svg {...S(p)}><path d="M12 15l3.5-5.5" /><path d="M20.5 16.5A9 9 0 1 0 3.5 16.5" /><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" /></svg>
);
export const IconUsers = (p) => (
  <svg {...S(p)}><path d="M16.5 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const IconFlag = (p) => (
  <svg {...S(p)}><path d="M5 21V3s1.2 1 4 1 5-2 8-2 2 1 2 1v11s-1-1-3-1-5 2-8 2-3-1-3-1Z" /></svg>
);
export const IconStar = (p) => (
  <svg {...S(p)}><path d="M12 3l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8" /></svg>
);
export const IconChart = (p) => (
  <svg {...S(p)}><path d="M4 20V4M4 20h16" /><path d="M9 16v-5M14 16V7M19 16v-3" /></svg>
);
export const IconShield = (p) => (
  <svg {...S(p)}><path d="M12 22s8-3.6 8-10V5.5L12 2 4 5.5V12c0 6.4 8 10 8 10Z" /><path d="M9 11.5l2 2 4-4.5" /></svg>
);
export const IconBell = (p) => (
  <svg {...S(p)}><path d="M18 8.5a6 6 0 0 0-12 0c0 7-3.5 8.5-3.5 8.5h19S18 15.5 18 8.5" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const IconSun = (p) => (
  <svg {...S(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
);
export const IconMoon = (p) => (
  <svg {...S(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
);
export const IconMenu = (p) => (
  <svg {...S(p)}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></svg>
);
export const IconLogout = (p) => (
  <svg {...S(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
);
export const IconArrow = (p) => (
  <svg {...S(p)}><path d="M4 12h16M13 5l7 7-7 7" /></svg>
);
export const IconCheck = (p) => (
  <svg {...S(p)}><path d="M20 6L9 17l-5-5" /></svg>
);
export const IconLogin = (p) => (
  <svg {...S(p)}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></svg>
);
export const IconDownload = (p) => (
  <svg {...S(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
);
export default {
  sprout: IconSprout, calendar: IconCalendar, gauge: IconGauge, users: IconUsers,
  flag: IconFlag, star: IconStar, chart: IconChart, shield: IconShield,
  bell: IconBell, sun: IconSun, moon: IconMoon, menu: IconMenu,
  logout: IconLogout, arrow: IconArrow, check: IconCheck, login: IconLogin, download: IconDownload
};