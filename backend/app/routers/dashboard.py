from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Activity, Book, Loan, Shelf, ShelfCollaborator, book_shelves
from app.schemas import ActivityResponse

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user_id = current_user.id

    books = db.query(Book).filter(
        Book.owner_id == user_id
    ).all()

    total_books = len(books)

    want_to_read = sum(
        1 for book in books
        if book.status == "Want to Read"
    )

    reading = sum(
        1 for book in books
        if book.status == "Reading"
    )

    finished = sum(
        1 for book in books
        if book.status == "Finished"
    )

    current_year = datetime.utcnow().year

    finished_this_year = db.query(Book).filter(
        Book.owner_id == user_id,
        Book.status == "Finished",
        Book.finished_at.isnot(None),
        func.extract("year", Book.finished_at) == current_year
    ).count()

    average_rating = db.query(
        func.avg(Book.rating)
    ).filter(
        Book.owner_id == user_id,
        Book.rating.isnot(None)
    ).scalar()

    if average_rating is not None:
        average_rating = round(float(average_rating), 2)

    shelves = db.query(Shelf).filter(
        Shelf.owner_id == user_id
    ).all()

    shelf_with_most_books = None
    max_books = 0

    for shelf in shelves:
        count = db.execute(
            book_shelves.select().where(
                book_shelves.c.shelf_id == shelf.id
            )
        ).fetchall()

        book_count = len(count)

        if book_count > max_books:
            max_books = book_count
            shelf_with_most_books = {
                "id": shelf.id,
                "name": shelf.name,
                "book_count": book_count
            }

    
    currently_lent = db.query(Loan).filter(
        Loan.owner_id == user_id,
        Loan.returned_at.is_(None)
    ).count()

    shared_shelves = db.query(
        ShelfCollaborator
    ).filter(
        ShelfCollaborator.user_id == user_id
    ).count()

    recent_activity = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "books": {
            "total": total_books,
            "want_to_read": want_to_read,
            "reading": reading,
            "finished": finished
        },
        "finished_this_year": finished_this_year,
        "average_rating": average_rating,
        "shelf_with_most_books": shelf_with_most_books,
        "currently_lent_out": currently_lent,
        "shelves_shared_with_me": shared_shelves,
        "recent_activity": [
            {
                "id": activity.id,
                "action": activity.action,
                "description": activity.description,
                "book_id": activity.book_id,
                "shelf_id": activity.shelf_id,
                "created_at": activity.created_at
            }
            for activity in recent_activity
        ]
    }