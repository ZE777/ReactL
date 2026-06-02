'use client'

// Injected before page renders to prevent flash of wrong theme.
// Reads localStorage 'theme' or falls back to system preference.
export function ThemeScript() {
  const script = `
    (function(){
      var stored = localStorage.getItem('theme');
      var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (dark) document.documentElement.classList.add('dark');
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
