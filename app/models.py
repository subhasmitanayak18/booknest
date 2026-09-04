from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Integer, Text, Table, Column
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

book_shelves = Table(
    "book_shelves",
    Base.metadata,
    Column("book_id", ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("shelf_id", ForeignKey("shelves.id", ondelete="CASCADE"), primary_key=True)
)
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    author: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Want to Read"
    )

    total_pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    rating: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    date_added: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    current_page: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )
class Shelf(Base):
    __tablename__ = "shelves"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )