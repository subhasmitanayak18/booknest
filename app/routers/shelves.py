from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Shelf, Book, User, book_shelves
from app.schemas import ShelfCreate, ShelfResponse
from app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/shelves",
    tags=["Shelves"]
)


@router.post("/", response_model=ShelfResponse)
def create_shelf(
    shelf: ShelfCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_shelf = Shelf(
        owner_id=current_user.id,
        name=shelf.name
    )

    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)

    return new_shelf


@router.get("/", response_model=list[ShelfResponse])
def get_shelves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelves = (
        db.query(Shelf)
        .filter(Shelf.owner_id == current_user.id)
        .all()
    )

    return shelves


@router.post("/{shelf_id}/books/{book_id}")
def add_book_to_shelf(
    shelf_id: int,
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = (
        db.query(Shelf)
        .filter(
            Shelf.id == shelf_id,
            Shelf.owner_id == current_user.id
        )
        .first()
    )

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

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

    existing = db.execute(
        book_shelves.select().where(
            (book_shelves.c.book_id == book_id) &
            (book_shelves.c.shelf_id == shelf_id)
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Book already exists on this shelf"
        )

    db.execute(
        book_shelves.insert().values(
            book_id=book_id,
            shelf_id=shelf_id
        )
    )

    db.commit()

    return {
        "message": "Book added to shelf successfully"
    }


@router.delete("/{shelf_id}/books/{book_id}")
def remove_book_from_shelf(
    shelf_id: int,
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = (
        db.query(Shelf)
        .filter(
            Shelf.id == shelf_id,
            Shelf.owner_id == current_user.id
        )
        .first()
    )

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    result = db.execute(
        book_shelves.delete().where(
            (book_shelves.c.book_id == book_id) &
            (book_shelves.c.shelf_id == shelf_id)
        )
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Book is not on this shelf"
        )

    db.commit()

    return {
        "message": "Book removed from shelf successfully"
    }


@router.delete("/{shelf_id}")
def delete_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = (
        db.query(Shelf)
        .filter(
            Shelf.id == shelf_id,
            Shelf.owner_id == current_user.id
        )
        .first()
    )

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    db.execute(
        book_shelves.delete().where(
            book_shelves.c.shelf_id == shelf_id
        )
    )

    db.delete(shelf)
    db.commit()

    return {
        "message": "Shelf deleted successfully"
    }