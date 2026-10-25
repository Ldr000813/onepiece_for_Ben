const PW_KEY = 'album-wiki:admin-password'

export function getPassword() {
  try { return localStorage.getItem(PW_KEY) ?? '' } catch { return '' }
}
export function setPassword(pw: string) {
  try { pw ? localStorage.setItem(PW_KEY, pw) : localStorage.removeItem(PW_KEY) } catch { /* noop */ }
}
