const KEY='fabvex.theme'
export function getTheme(){if(typeof localStorage==='undefined')return 'dark';return localStorage.getItem(KEY)==='light'?'light':'dark'}
export function setTheme(theme){const value=theme==='light'?'light':'dark';if(typeof document!=='undefined')document.documentElement.dataset.theme=value;if(typeof localStorage!=='undefined')localStorage.setItem(KEY,value);return value}
export function initTheme(){return setTheme(getTheme())}
