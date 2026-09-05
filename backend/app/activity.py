from sqlalchemy.orm import Session

from app.models import Activity
from app.realtime import manager


async def create_activity(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    book_id: int | None = None,
    shelf_id: int | None = None,
    notify_user_ids: list[int] | None = None
):
    activity = Activity(
        user_id=user_id,
        action=action,
        description=description,
        book_id=book_id,
        shelf_id=shelf_id
    )

    db.add(activity)
    db.flush()

    event = {
        "type": "ACTIVITY_CREATED",
        "data": {
            "id": activity.id,
            "user_id": activity.user_id,
            "action": activity.action,
            "description": activity.description,
            "book_id": activity.book_id,
            "shelf_id": activity.shelf_id,
            "created_at": (
                activity.created_at.isoformat()
                if activity.created_at
                else None
            )
        }
    }

    recipients = notify_user_ids or [user_id]

    for recipient_id in set(recipients):
        await manager.send_to_user(
            recipient_id,
            event
        )

    return activity