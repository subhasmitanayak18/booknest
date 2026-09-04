from sqlalchemy.orm import Session

from app.models import Activity


def create_activity(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    book_id: int | None = None,
    shelf_id: int | None = None
):
    activity = Activity(
        user_id=user_id,
        action=action,
        description=description,
        book_id=book_id,
        shelf_id=shelf_id
    )

    db.add(activity)

    return activity