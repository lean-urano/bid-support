from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
from pydantic import BaseModel
import os

from db.base import get_db
from models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24時間

# MIRROR SSO(sso/idp)経由でのログインのみをサポートする。ここで発行するJWTは
# フロントエンドのOIDCコールバックがsso-syncを叩いた後、tender-support API自身の
# 呼び出し認可に使うものであり、ログイン手段そのものではない。
# デフォルト値を与えると本番でも既知の値のまま起動できてしまい、この共有シークレットが
# 事実上無認証のユーザー作成口になってしまうため、明示的な設定を必須にする。
SSO_SYNC_SECRET = os.environ["SSO_SYNC_SECRET"]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str


class SsoSyncRequest(BaseModel):
    email: str
    name: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="無効なトークン")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="無効なトークン")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ユーザーが見つかりません")
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="管理者権限が必要です")
    return current_user


@router.post("/sso-sync", response_model=TokenResponse)
async def sso_sync(
    req: SsoSyncRequest,
    db: AsyncSession = Depends(get_db),
    x_sso_sync_secret: str = Header(default=""),
):
    # MIRROR SSO(sso/idp)でのログイン確認後、tender-supportのフロントエンド(OIDCコールバック)
    # からのみ呼ばれる想定。ブラウザから直接叩けるユーザー作成口にならないよう共有シークレットで守る。
    if x_sso_sync_secret != SSO_SYNC_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="不正なリクエストです")

    result = await db.execute(select(User).where(User.email == req.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(email=req.email, name=req.name, role=UserRole.user)
        db.add(user)
    else:
        user.name = req.name

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=token, token_type="bearer", role=user.role, name=user.name)


@router.post("/admin-login", response_model=TokenResponse)
async def admin_login(req: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    # 一般ユーザーはMIRROR SSO(sso-sync)のみ。ここは管理者専用のメール・パスワードログインで、
    # role=admin以外のアカウントはパスワードが仮に一致しても拒否する。
    result = await db.execute(
        select(User).where(User.email == req.email, User.role == UserRole.admin, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="メールアドレスまたはパスワードが違います")

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=token, token_type="bearer", role=user.role, name=user.name)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "role": current_user.role}
