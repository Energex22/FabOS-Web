const TOKEN_KEY='fabos.session.token'
export function getToken(){try{return localStorage.getItem(TOKEN_KEY)||''}catch{return ''}}
export function setToken(token){if(token)localStorage.setItem(TOKEN_KEY,token);else localStorage.removeItem(TOKEN_KEY)}
export function clearToken(){setToken('')}
export function authHeaders(){const token=getToken();return token?{Authorization:`Bearer ${token}`}:{}}
