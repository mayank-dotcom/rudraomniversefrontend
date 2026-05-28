const ADMIN_KEY_STORAGE = "rudranex_admin_key"

export interface UserInfo {
  name: string
  email: string
}

export function setUserInfo(name: string, email: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("rudranex_user_name", name)
    localStorage.setItem("rudranex_user_email", email)
  }
}

export function getUserInfo(): UserInfo | null {
  if (typeof window !== "undefined") {
    const name = localStorage.getItem("rudranex_user_name")
    const email = localStorage.getItem("rudranex_user_email")
    if (name && email) {
      return { name, email }
    }
  }
  return null
}

export function removeUserInfo() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("rudranex_user_name")
    localStorage.removeItem("rudranex_user_email")
  }
}

export function setApiKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("rudranex_api_key", key)
  }
}

export function getApiKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("rudranex_api_key")
  }
  return null
}

export function removeApiKey() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("rudranex_api_key")
  }
}

export function isAuthenticated(): boolean {
  return !!getApiKey()
}

export function setAdminKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_KEY_STORAGE, key)
  }
}

export function getAdminKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ADMIN_KEY_STORAGE)
  }
  return null
}

export function removeAdminKey() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_KEY_STORAGE)
  }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminKey()
}

const USER_ROLE_STORAGE = "rudranex_user_role"

export function setUserRole(role: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_ROLE_STORAGE, role)
  }
}

export function getUserRole(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(USER_ROLE_STORAGE)
  }
  return null
}

export function removeUserRole() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_ROLE_STORAGE)
  }
}
