from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str

class BookStatus(str, Enum):
    WANT_TO_READ = "Want to Read"
    READING = "Reading"
    FINISHED = "Finished"

class BookCreate(BaseModel):
    title: str
    author: str

    status: BookStatus = BookStatus.WANT_TO_READ
    total_pages: int = Field(
        gt=0
    )

    rating: Optional[int] = Field(
        default=None,
        ge=1,
        le=5
    )

    notes: Optional[str] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[BookStatus] = None

    total_pages: Optional[int] = Field(
        default=None,
        gt=0
    )

    rating: Optional[int] = Field(
        default=None,
        ge=1,
        le=5
    )

    notes: Optional[str] = None


class BookResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    author: str
    status: str
    total_pages: int
    rating: Optional[int]
    notes: Optional[str]
    date_added: object
    finished_at: Optional[object]
    current_page: Optional[int]

    class Config:
        from_attributes = True
class ShelfCreate(BaseModel):
    name: str


class ShelfResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True
class ShelfShareRequest(BaseModel):
    email: EmailStr
    role: str = "viewer"


class ShelfCollaboratorResponse(BaseModel):
    id: int
    shelf_id: int
    user_id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
class ShelfRoleUpdate(BaseModel):
    role: str