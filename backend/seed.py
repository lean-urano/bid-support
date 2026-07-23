"""初期データ投入: 開発用アカウントの事前登録"""
import asyncio
from db.base import SessionLocal
from models.user import User, UserRole
from api.auth import hash_password


async def seed():
    async with SessionLocal() as db:
        users = [
            # 一般ユーザーはMIRROR SSO経由。sso/idpの開発用デモアカウント(alice@example.com)に
            # ロールを割り当てておく。実際のユーザーレコードはSSOログイン時にsso-syncで作成される。
            User(email="alice@example.com", name="Alice(SSO)", role=UserRole.user),
            # 管理者はSSOを使わずメール・パスワードでログインする(/admin/login)。開発用の固定パスワード。
            User(email="admin@tender-support.jp", name="管理者", password_hash=hash_password("admin1234"), role=UserRole.admin),
        ]
        db.add_all(users)
        await db.commit()
        print("シード完了:")
        for u in users:
            print(f"  {u.role}: {u.email}")


if __name__ == "__main__":
    asyncio.run(seed())
