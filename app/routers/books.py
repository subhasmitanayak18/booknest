from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from app.database import get_db
from app.models import Book, User
from app.schemas import BookCreate, BookResponse,BookStatus, BookUpdate
from app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/books",
    tags=["Books"]
)


@router.post("/", response_model=BookResponse)
def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_book = Book(
        owner_id=current_user.id,
        title=book.title,
        author=book.author,
        status=book.status.value,
        total_pages=book.total_pages,
        rating=book.rating,
        notes=book.notes
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return new_book
@router.get("/", response_model=list[BookResponse])
def get_books(
    status: BookStatus | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("date_added"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        db.query(Book)
        .filter(Book.owner_id == current_user.id)
    )
    if status:
        query = query.filter(Book.status == status.value)
    if search:
        search_term = f"%{search}%"

        query = query.filter(
            (Book.title.ilike(search_term)) |
            (Book.author.ilike(search_term))
        )
    sort_columns = {
        "rating": Book.rating,
        "title": Book.title,
        "date_added": Book.date_added
    }

    if sort_by not in sort_columns:
        sort_by = "date_added"

    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_columns[sort_by]))
    else:
        query = query.order_by(desc(sort_columns[sort_by]))
    offset = (page - 1) * page_size

    books = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return books
@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_book = (
        db.query(Book)
        .filter(
            Book.id == book_id,
            Book.owner_id == current_user.id
        )
        .first()
    )

    if not existing_book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    if book.title is not None:
        existing_book.title = book.title

    if book.author is not None:
        existing_book.author = book.author

    if book.status is not None:
        existing_book.status = book.status.value

    if book.total_pages is not None:
        existing_book.total_pages = book.total_pages

    if book.rating is not None:
        existing_book.rating = book.rating

    if book.notes is not None:
        existing_book.notes = book.notes

    db.commit()
    db.refresh(existing_book)

    return existing_book
@router.delete("/{book_id}")
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_book = (
        db.query(Book)
        .filter(
            Book.id == book_id,
            Book.owner_id == current_user.id
        )
        .first()
    )

    if not existing_book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    db.delete(existing_book)
    db.commit()

    return {
        "message": "Book deleted successfully"
    }