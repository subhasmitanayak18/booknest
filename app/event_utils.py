from app.realtime import manager


async def notify_user(
    user_id: int,
    event_type: str,
    data: dict | None = None
):
    await manager.send_to_user(
        user_id,
        {
            "type": event_type,
            "data": data or {}
        }
    )


async def notify_users(
    user_ids: list[int],
    event_type: str,
    data: dict | None = None
):
    await manager.send_to_users(
        user_ids,
        {
            "type": event_type,
            "data": data or {}
        }
    )