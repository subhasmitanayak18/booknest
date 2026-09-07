from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from app.database import get_db
from app.models import Book, User
from app.schemas import (
    BookCreate,
    BookResponse,
    BookStatus,
    BookUpdate,
    ReadingProgressUpdate
)
from app.dependencies.auth import get_current_user
from datetime import datetime
from app.activity import create_activity
from app.event_utils import notify_user


router = APIRouter(
    prefix="/books",
    tags=["Books"]
)


@router.post("/", response_model=BookResponse)
async def create_book(
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

    # If the book is created as Finished,
    # record when it was completed.
    if book.status.value == BookStatus.FINISHED.value:
        new_book.finished_at = datetime.utcnow()

    db.add(new_book)
    db.flush()

    await create_activity(
        db=db,
        user_id=current_user.id,
        action="BOOK_ADDED",
        description=f'Added book "{new_book.title}"',
        book_id=new_book.id
    )

    db.commit()
    db.refresh(new_book)

    await notify_user(
        current_user.id,
        "BOOK_ADDED",
        {
            "book_id": new_book.id,
            "title": new_book.title,
            "status": new_book.status
        }
    )

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
        query = query.order_by(
            asc(sort_columns[sort_by])
        )
    else:
        query = query.order_by(
            desc(sort_columns[sort_by])
        )

    offset = (page - 1) * page_size

    books = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return books


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
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

    old_status = existing_book.status

    if book.title is not None:
        existing_book.title = book.title

    if book.author is not None:
        existing_book.author = book.author

    if book.status is not None:
        new_status = book.status.value
        existing_book.status = new_status

        # Handle completion timestamp whenever
        # the reading status changes.
        if new_status == BookStatus.FINISHED.value:
            # Set a completion time when the book becomes Finished.
            # This also handles Finished -> Finished updates safely.
            if old_status != BookStatus.FINISHED.value:
                existing_book.finished_at = datetime.utcnow()

        else:
            # Any status other than Finished means
            # the book is no longer considered completed.
            existing_book.finished_at = None

    if book.total_pages is not None:
        existing_book.total_pages = book.total_pages

    if book.rating is not None:
        existing_book.rating = book.rating

    if book.notes is not None:
        existing_book.notes = book.notes

    if existing_book.status != old_status:
        await create_activity(
            db=db,
            user_id=current_user.id,
            action="STATUS_CHANGED",
            description=(
                f'Changed "{existing_book.title}" status '
                f'from "{old_status}" to "{existing_book.status}"'
            ),
            book_id=existing_book.id
        )

    db.commit()
    db.refresh(existing_book)

    await notify_user(
        current_user.id,
        "BOOK_UPDATED",
        {
            "book_id": existing_book.id,
            "title": existing_book.title,
            "status": existing_book.status
        }
    )

    return existing_book


@router.delete("/{book_id}")
async def delete_book(
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

    await notify_user(
        current_user.id,
        "BOOK_DELETED",
        {
            "book_id": book_id
        }
    )

    return {
        "message": "Book deleted successfully"
    }


@router.put("/{book_id}/progress")
async def update_reading_progress(
    book_id: int,
    data: ReadingProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = (
        db.query(Book)
        .filter(
            Book.id == book_id,
            Book.owner_id == current_user.id
        )
        .first()
    )

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found"
        )

    if book.status != BookStatus.READING.value:
        raise HTTPException(
            status_code=400,
            detail="Reading progress can only be updated for books with Reading status"
        )

    if book.total_pages is None:
        raise HTTPException(
            status_code=400,
            detail="Reading progress cannot be updated because total pages is not set"
        )

    if data.current_page > book.total_pages:
        raise HTTPException(
            status_code=400,
            detail="Current page cannot be greater than total pages"
        )

    book.current_page = data.current_page

    # Automatically finish the book when the last page is reached.
    if data.current_page == book.total_pages:
        book.status = BookStatus.FINISHED.value
        book.finished_at = datetime.utcnow()

        await create_activity(
            db=db,
            user_id=current_user.id,
            action="STATUS_CHANGED",
            description=(
                f'Changed "{book.title}" status '
                f'from "Reading" to "Finished"'
            ),
            book_id=book.id
        )

    db.commit()
    db.refresh(book)

    percentage = (
        book.current_page / book.total_pages
    ) * 100

    await notify_user(
        current_user.id,
        "READING_PROGRESS_UPDATED",
        {
            "book_id": book.id,
            "current_page": book.current_page,
            "total_pages": book.total_pages,
            "percentage": round(percentage, 2),
            "status": book.status
        }
    )

    return {
        "book_id": book.id,
        "current_page": book.current_page,
        "total_pages": book.total_pages,
        "percentage": round(percentage, 2),
        "status": book.status,
        "finished_at": book.finished_at
    }