import LoginForm from "@/components/LoginForm"

export default function UserLoginPage() {
  return (
    <LoginForm
      title="tender-support ログイン"
      redirectTo="/dashboard"
      expectedRole="user"
      devCredentials={[
        { label: "ユーザー", email: "user@tender-support.jp", password: "user1234" },
      ]}
    />
  )
}
