export const AUTH_TOKEN_KEY='fabos.auth.token'

export function getToken(){
 try{return typeof localStorage!=='undefined'?localStorage.getItem(AUTH_TOKEN_KEY)||'':''}
 catch{return ''}
}

export function setToken(token){
 if(typeof localStorage==='undefined')return
 try{
  if(token)localStorage.setItem(AUTH_TOKEN_KEY,token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
 }catch{}
}

export function clearToken(){setToken('')}

export function authHeaders(){
 const token=getToken()
 return token?{Authorization:`Bearer ${token}`}:{}
}
