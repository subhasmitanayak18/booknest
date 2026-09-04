from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Shelf, Book, User, ShelfCollaborator, book_shelves
from app.schemas import (
    ShelfCreate,
    ShelfResponse,
    ShelfShareRequest,
    ShelfCollaboratorResponse,
    ShelfRoleUpdate
)
from app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/shelves",
    tags=["Shelves"]
)


def get_collaborator(
    shelf_id: int,
    user_id: int,
    db: Session
):
    return db.query(ShelfCollaborator).filter(
        ShelfCollaborator.shelf_id == shelf_id,
        ShelfCollaborator.user_id == user_id
    ).first()


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
    return (
        db.query(Shelf)
        .filter(Shelf.owner_id == current_user.id)
        .all()
    )


@router.get("/shared-with-me")
def get_shared_shelves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    collaborations = db.query(ShelfCollaborator).filter(
        ShelfCollaborator.user_id == current_user.id
    ).all()

    result = []

    for collaboration in collaborations:
        shelf = db.query(Shelf).filter(
            Shelf.id == collaboration.shelf_id
        ).first()

        if shelf:
            result.append({
                "id": shelf.id,
                "name": shelf.name,
                "owner_id": shelf.owner_id,
                "role": collaboration.role
            })

    return result


@router.get("/{shelf_id}")
def get_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    is_owner = shelf.owner_id == current_user.id

    collaborator = get_collaborator(
        shelf_id,
        current_user.id,
        db
    )

    if not is_owner and not collaborator:
        raise HTTPException(403, "You do not have access to this shelf")

    rows = db.execute(
        book_shelves.select().where(
            book_shelves.c.shelf_id == shelf_id
        )
    ).fetchall()

    books = []

    for row in rows:
        book = db.query(Book).filter(
            Book.id == row.book_id
        ).first()

        if book:
            books.append(book)

    return {
        "id": shelf.id,
        "name": shelf.name,
        "owner_id": shelf.owner_id,
        "role": "owner" if is_owner else collaborator.role,
        "books": books
    }


@router.post("/{shelf_id}/books/{book_id}")
def add_book_to_shelf(
    shelf_id: int,
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    collaborator = get_collaborator(
        shelf_id,
        current_user.id,
        db
    )

    is_owner = shelf.owner_id == current_user.id

    if not is_owner and (
        not collaborator or collaborator.role != "editor"
    ):
        raise HTTPException(
            403,
            "Only the owner or editor can add books"
        )

    book = db.query(Book).filter(
        Book.id == book_id,
        Book.owner_id == shelf.owner_id
    ).first()

    if not book:
        raise HTTPException(
            404,
            "Book not found"
        )

    existing = db.execute(
        book_shelves.select().where(
            (book_shelves.c.book_id == book_id) &
            (book_shelves.c.shelf_id == shelf_id)
        )
    ).first()

    if existing:
        raise HTTPException(
            400,
            "Book already exists on this shelf"
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
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    collaborator = get_collaborator(
        shelf_id,
        current_user.id,
        db
    )

    is_owner = shelf.owner_id == current_user.id

    if not is_owner and (
        not collaborator or collaborator.role != "editor"
    ):
        raise HTTPException(
            403,
            "Only the owner or editor can remove books"
        )

    result = db.execute(
        book_shelves.delete().where(
            (book_shelves.c.book_id == book_id) &
            (book_shelves.c.shelf_id == shelf_id)
        )
    )

    if result.rowcount == 0:
        raise HTTPException(
            404,
            "Book is not on this shelf"
        )

    db.commit()

    return {
        "message": "Book removed from shelf successfully"
    }


@router.post(
    "/{shelf_id}/share",
    response_model=ShelfCollaboratorResponse
)
def share_shelf(
    shelf_id: int,
    data: ShelfShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.owner_id == current_user.id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    if data.role not in ["editor", "viewer"]:
        raise HTTPException(
            400,
            "Role must be editor or viewer"
        )

    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            404,
            "User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            400,
            "Owner cannot be added as collaborator"
        )

    existing = db.query(ShelfCollaborator).filter(
        ShelfCollaborator.shelf_id == shelf_id,
        ShelfCollaborator.user_id == user.id
    ).first()

    if existing:
        raise HTTPException(
            400,
            "User is already a collaborator"
        )

    collaborator = ShelfCollaborator(
        shelf_id=shelf_id,
        user_id=user.id,
        role=data.role
    )

    db.add(collaborator)
    db.commit()
    db.refresh(collaborator)

    return collaborator


@router.put(
    "/{shelf_id}/collaborators/{user_id}",
    response_model=ShelfCollaboratorResponse
)
def change_collaborator_role(
    shelf_id: int,
    user_id: int,
    data: ShelfRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.owner_id == current_user.id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    if data.role not in ["editor", "viewer"]:
        raise HTTPException(
            400,
            "Role must be editor or viewer"
        )

    collaborator = db.query(ShelfCollaborator).filter(
        ShelfCollaborator.shelf_id == shelf_id,
        ShelfCollaborator.user_id == user_id
    ).first()

    if not collaborator:
        raise HTTPException(
            404,
            "Collaborator not found"
        )

    collaborator.role = data.role

    db.commit()
    db.refresh(collaborator)

    return collaborator


@router.delete("/{shelf_id}/collaborators/{user_id}")
def remove_collaborator(
    shelf_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.owner_id == current_user.id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    collaborator = db.query(ShelfCollaborator).filter(
        ShelfCollaborator.shelf_id == shelf_id,
        ShelfCollaborator.user_id == user_id
    ).first()

    if not collaborator:
        raise HTTPException(
            404,
            "Collaborator not found"
        )

    db.delete(collaborator)
    db.commit()

    return {
        "message": "Collaborator removed successfully"
    }


@router.delete("/{shelf_id}")
def delete_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.owner_id == current_user.id
    ).first()

    if not shelf:
        raise HTTPException(404, "Shelf not found")

    db.execute(
        book_shelves.delete().where(
            book_shelves.c.shelf_id == shelf_id
        )
    )

    db.query(ShelfCollaborator).filter(
        ShelfCollaborator.shelf_id == shelf_id
    ).delete()

    db.delete(shelf)
    db.commit()

    return {
        "message": "Shelf deleted successfully"
    }