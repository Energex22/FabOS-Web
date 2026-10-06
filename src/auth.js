export const AUTH_TOKEN_KEY='fabos.auth.token'
export const AUTH_ACCOUNT_TYPE_KEY='fabos.auth.account_type'

const TEAM_ACCOUNT_TYPES=['employee','administrator']
export function isTeamAccountType(value){return TEAM_ACCOUNT_TYPES.includes(String(value||'').toLowerCase())}

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

export function getAccountType(){
 try{return typeof localStorage!=='undefined'?localStorage.getItem(AUTH_ACCOUNT_TYPE_KEY)||'':''}
 catch{return ''}
}

export function setAccountType(accountType){
 if(typeof localStorage==='undefined')return
 try{
  if(accountType)localStorage.setItem(AUTH_ACCOUNT_TYPE_KEY,accountType)
  else localStorage.removeItem(AUTH_ACCOUNT_TYPE_KEY)
 }catch{}
}

export function clearAccountType(){setAccountType('')}

export function authHeaders(){
 const token=getToken()
 return token?{Authorization:`Bearer ${token}`}:{}
}
