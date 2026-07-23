"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

type User = {
  name: string;
  email: string;
  role: "user" | "admin";
} | null;

type AuthContextType = {
  user: User;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: User }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    // 未ログインかつログインページ以外にアクセスした場合はログインフォーム(/login)へリダイレクト
    // (SSOへの遷移はログインフォーム上のボタン押下時のみ行う。ここで直接/api/auth/loginに飛ばすと
    //  SSO未起動時にdiscoveryが失敗してエラー画面になってしまうため避ける)
    // (管理者用の/admin/loginはメール・パスワードの別ログインのためリダイレクト対象から除外する)
    if (!user && pathname !== "/login" && pathname !== "/admin/login") {
      window.location.assign(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname]);

  const logout = () => {
    window.location.assign("/api/auth/logout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        認証状態を確認中...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
