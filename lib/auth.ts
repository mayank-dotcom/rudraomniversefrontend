const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!
const ADMIN_KEY_STORAGE = "rudranex_admin_key"

export interface AuthResponse {
  success: boolean
  api_key: string
  message: string
  error?: string
  name?: string
  email?: string
}

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

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
  return res.json()
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function getUserProfile(apiKey: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  })
  return res.json()
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

export interface AdminLoginResponse {
  success: boolean
  admin_key?: string
  message?: string
  error?: string
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json();
  if (data.success && data.admin_key) {
    setAdminKey(data.admin_key);
  }
  return data;
}

// Keep the old function name for backward compatibility
export async function adminLoginWithKey(key: string): Promise<boolean> {
  try {
    setAdminKey(key);
    // Verify the key by making a test request
    const testRes = await fetch(`${API_BASE}/admin/users`, {
      method: "GET",
      headers: { "x-api-key": key },
    });
    const data = await testRes.json();
    if (data.success) {
      return true;
    } else {
      removeAdminKey();
      return false;
    }
  } catch (err) {
    removeAdminKey();
    return false;
  }
}
