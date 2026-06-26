import LoginForm from "@/components/LoginForm"

export default function AdminLoginPage() {
  return (
    <LoginForm
      title="管理者ログイン"
      redirectTo="/admin/dashboard"
      expectedRole="admin"
      devCredentials={[
        { label: "管理者", email: "admin@tender-support.jp", password: "admin1234" },
      ]}
    />
  )
}
