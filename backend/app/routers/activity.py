from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, User
from app.schemas import ActivityResponse
from app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/activity",
    tags=["Activity"]
)


@router.get("/", response_model=list[ActivityResponse])
def get_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .all()
    )