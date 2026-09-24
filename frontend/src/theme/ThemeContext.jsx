import { createContext, useContext, useEffect, useState } from 'react';
const Ctx = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('mm_theme') || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mm_theme', theme);
  }, [theme]);
  return <Ctx.Provider value={{ theme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
