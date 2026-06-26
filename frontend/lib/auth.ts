const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type AuthResult = {
  access_token: string
  token_type: string
  role: string
  name: string
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || "ログインに失敗しました")
  }

  return res.json()
}

export function saveToken(token: string) {
  localStorage.setItem("access_token", token)
}

export function getToken(): string | null {
  return localStorage.getItem("access_token")
}

export function removeToken() {
  localStorage.removeItem("access_token")
}
