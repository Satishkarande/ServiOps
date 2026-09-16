import os
import uuid
from pathlib import Path


STORAGE_DIR = Path(os.getenv("SERVIOPS_UPLOAD_DIR", "uploads/ticket_comments"))


def generate_storage_key(ticket_id: int, comment_id: int) -> str:
    return f"{ticket_id}/{comment_id}/{uuid.uuid4().hex}"


def get_storage_path(storage_key: str) -> Path:
    root = STORAGE_DIR.resolve()
    path = (STORAGE_DIR / storage_key).resolve()

    if root != path and root not in path.parents:
        raise ValueError("Invalid attachment storage path")

    return path


def save_file(storage_key: str, data: bytes) -> Path:
    path = get_storage_path(storage_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def delete_file(storage_key: str) -> None:
    get_storage_path(storage_key).unlink(missing_ok=True)
