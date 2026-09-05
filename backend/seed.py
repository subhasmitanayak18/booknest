from datetime import datetime

from app.database import SessionLocal, Base, engine
from app.models import (
    User,
    Book,
    Shelf,
    ShelfCollaborator,
    Loan,
    Activity,
    book_shelves,
)
from app.security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Clear existing seed data
        db.query(Activity).delete()
        db.query(Loan).delete()
        db.execute(book_shelves.delete())
        db.query(ShelfCollaborator).delete()
        db.query(Shelf).delete()
        db.query(Book).delete()
        db.query(User).delete()
        db.commit()

        # Users
        user1 = User(
            name="Alice",
            email="alice@booknest.com",
            password_hash=hash_password("Password123!")
        )

        user2 = User(
            name="Bob",
            email="bob@booknest.com",
            password_hash=hash_password("Password123!")
        )

        db.add_all([user1, user2])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)

        # Books
        book1 = Book(
            owner_id=user1.id,
            title="The Pragmatic Programmer",
            author="Andrew Hunt and David Thomas",
            status="Reading",
            total_pages=352,
            current_page=120,
            rating=5,
            notes="Backend and software engineering fundamentals."
        )

        book2 = Book(
            owner_id=user1.id,
            title="Clean Code",
            author="Robert C. Martin",
            status="Want to Read",
            total_pages=464
        )

        book3 = Book(
            owner_id=user2.id,
            title="Atomic Habits",
            author="James Clear",
            status="Finished",
            total_pages=320,
            current_page=320,
            rating=5,
            finished_at=datetime.utcnow()
        )

        db.add_all([book1, book2, book3])
        db.commit()

        # Shelves
        alice_shelf = Shelf(
            owner_id=user1.id,
            name="Software Engineering"
        )

        bob_shelf = Shelf(
            owner_id=user2.id,
            name="Personal Development"
        )

        db.add_all([alice_shelf, bob_shelf])
        db.commit()

        db.refresh(alice_shelf)
        db.refresh(bob_shelf)

        # Add books to shelves
        db.execute(
            book_shelves.insert(),
            [
                {
                    "book_id": book1.id,
                    "shelf_id": alice_shelf.id,
                },
                {
                    "book_id": book2.id,
                    "shelf_id": alice_shelf.id,
                },
                {
                    "book_id": book3.id,
                    "shelf_id": bob_shelf.id,
                },
            ]
        )

        # Share Alice's shelf with Bob as editor
        collaborator = ShelfCollaborator(
            shelf_id=alice_shelf.id,
            user_id=user2.id,
            role="editor"
        )

        db.add(collaborator)

        # Lend Alice's book to Bob
        loan = Loan(
            book_id=book2.id,
            owner_id=user1.id,
            borrower_id=user2.id
        )

        db.add(loan)

        # Activity
        activities = [
            Activity(
                user_id=user1.id,
                action="BOOK_ADDED",
                description="Added The Pragmatic Programmer."
            ),
            Activity(
                user_id=user1.id,
                action="BOOK_ADDED",
                description="Added Clean Code."
            ),
            Activity(
                user_id=user1.id,
                action="SHELF_SHARED",
                description="Shared Software Engineering with Bob as editor.",
                shelf_id=alice_shelf.id
            ),
            Activity(
                user_id=user1.id,
                action="BOOK_LENT",
                description="Lent Clean Code to Bob.",
                book_id=book2.id
            ),
            Activity(
                user_id=user2.id,
                action="BOOK_ADDED",
                description="Added Atomic Habits."
            ),
        ]

        db.add_all(activities)

        db.commit()

        print("Seed data created successfully.")
        print()
        print("User 1:")
        print("  Email: alice@booknest.com")
        print("  Password: Password123!")
        print()
        print("User 2:")
        print("  Email: bob@booknest.com")
        print("  Password: Password123!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()