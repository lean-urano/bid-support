"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { login, saveToken } from "@/lib/auth"

type DevCredential = { label: string; email: string; password: string }

type Props = {
  title: string
  redirectTo: string
  expectedRole: string
  devCredentials?: DevCredential[]
}

const isDev = process.env.NODE_ENV === "development"

export default function LoginForm({ title, redirectTo, expectedRole, devCredentials = [] }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.role !== expectedRole) {
        setError("このページからはログインできません")
        return
      }
      saveToken(result.access_token)
      router.push(redirectTo)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  function fillCredentials(cred: DevCredential) {
    setEmail(cred.email)
    setPassword(cred.password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-3">
        {isDev && devCredentials.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-yellow-700 font-semibold">開発用クイックログイン</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-2">
              {devCredentials.map((cred) => (
                <Button
                  key={cred.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                  onClick={() => fillCredentials(cred)}
                >
                  {cred.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
