"""初期データ投入: 管理者・ユーザーのサンプルアカウントを作成"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from db.base import engine, SessionLocal
from models.user import User, UserRole
from api.auth import hash_password


async def seed():
    async with SessionLocal() as db:
        users = [
            User(email="admin@tender-support.jp", name="管理者", password_hash=hash_password("admin1234"), role=UserRole.admin),
            User(email="user@tender-support.jp", name="テストユーザー", password_hash=hash_password("user1234"), role=UserRole.user),
        ]
        db.add_all(users)
        await db.commit()
        print("シード完了:")
        for u in users:
            print(f"  {u.role}: {u.email}")


if __name__ == "__main__":
    asyncio.run(seed())
