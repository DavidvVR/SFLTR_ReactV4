// src/features/auth/auth.ts

export const SESSION_KEY = "sfltr_token"

// Usuario de prueba hardcodeado
const DEMO_USER = {
  username: "IngDavidVR",
  email: "admin@sistemaroque.mx",
  password: "123",
}

// Guarda token en localStorage
export function setSession(token: string) {
  localStorage.setItem(SESSION_KEY, token)
}

// Limpia sesión
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

// Obtén token actual
export function getToken(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

// ¿Hay sesión activa?
export function isLoggedIn(): boolean {
  return !!getToken()
}

// Login local: valida usuario/contraseña y genera token sencillo
export function loginLocal(identifier: string, password: string): boolean {
  if (
    (identifier === DEMO_USER.username || identifier === DEMO_USER.email) &&
    password === DEMO_USER.password
  ) {
    const token = btoa(`${identifier}:${Date.now()}`) // token simple base64
    setSession(token)
    return true
  }
  return false
}

// Logout
export function logout() {
  clearSession()
}
