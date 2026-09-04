from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Loan, Book, User
from app.schemas import LoanCreate, LoanResponse
from app.dependencies.auth import get_current_user
from app.activity import create_activity
from app.event_utils import notify_users


router = APIRouter(
    prefix="/loans",
    tags=["Loans"]
)


@router.post("/{book_id}", response_model=LoanResponse)
async def lend_book(
    book_id: int,
    data: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only the owner can lend their book
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.owner_id == current_user.id
    ).first()

    if not book:
        raise HTTPException(
            status_code=404,
            detail="Book not found or you do not own this book"
        )

    # Owner cannot lend a book to themselves
    borrower = db.query(User).filter(
        User.email == data.borrower_email
    ).first()

    if not borrower:
        raise HTTPException(
            status_code=404,
            detail="Borrower not found"
        )

    if borrower.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot lend a book to yourself"
        )

    # Prevent double lending while an active loan exists
    active_loan = db.query(Loan).filter(
        Loan.book_id == book_id,
        Loan.returned_at.is_(None)
    ).first()

    if active_loan:
        raise HTTPException(
            status_code=400,
            detail="Book is already lent out"
        )

    loan = Loan(
        book_id=book.id,
        owner_id=current_user.id,
        borrower_id=borrower.id,
        lent_at=datetime.utcnow()
    )

    db.add(loan)
    db.flush()

    await create_activity(
        db=db,
        user_id=current_user.id,
        action="BOOK_LENT",
        description=(
            f'Lent "{book.title}" to {borrower.email}'
        ),
        book_id=book.id,
        notify_user_ids=[current_user.id, borrower.id]
    )

    db.commit()
    db.refresh(loan)

    # Notify both owner and borrower in real time
    await notify_users(
        [current_user.id, borrower.id],
        "BOOK_LENT",
        {
            "loan_id": loan.id,
            "book_id": book.id,
            "owner_id": current_user.id,
            "borrower_id": borrower.id
        }
    )

    return loan


@router.get("/", response_model=list[LoanResponse])
def get_my_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Owner sees loans for books they own
    return (
        db.query(Loan)
        .filter(Loan.owner_id == current_user.id)
        .order_by(Loan.lent_at.desc())
        .all()
    )


@router.get("/borrowed")
def get_borrowed_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Borrower gets a read-only view of books lent to them
    loans = (
        db.query(Loan)
        .filter(Loan.borrower_id == current_user.id)
        .order_by(Loan.lent_at.desc())
        .all()
    )

    result = []

    for loan in loans:
        book = db.query(Book).filter(
            Book.id == loan.book_id
        ).first()

        if book:
            result.append({
                "loan_id": loan.id,
                "book_id": book.id,
                "title": book.title,
                "author": book.author,
                "status": book.status,
                "total_pages": book.total_pages,
                "rating": book.rating,
                "notes": book.notes,
                "lent_at": loan.lent_at,
                "returned_at": loan.returned_at,
                "owner_id": loan.owner_id
            })

    return result


@router.put("/{loan_id}/return", response_model=LoanResponse)
async def return_book(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only the owner can mark the book as returned
    loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.owner_id == current_user.id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    if loan.returned_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Book has already been returned"
        )

    book = db.query(Book).filter(
        Book.id == loan.book_id
    ).first()

    loan.returned_at = datetime.utcnow()

    await create_activity(
        db=db,
        user_id=current_user.id,
        action="BOOK_RETURNED",
        description=(
            f'Received "{book.title if book else "book"}" back from '
            f'borrower {loan.borrower_id}'
        ),
        book_id=loan.book_id,
        notify_user_ids=[loan.owner_id, loan.borrower_id]
    )

    db.commit()
    db.refresh(loan)

    # Notify both owner and borrower
    await notify_users(
        [loan.owner_id, loan.borrower_id],
        "BOOK_RETURNED",
        {
            "loan_id": loan.id,
            "book_id": loan.book_id,
            "owner_id": loan.owner_id,
            "borrower_id": loan.borrower_id
        }
    )

    return loan