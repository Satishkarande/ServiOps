from sqlalchemy import text

from app.database import SessionLocal


db = SessionLocal()

try:
    result = db.execute(text("SELECT 1"))

    print("Database session works!")
    print("Result:", result.scalar())

finally:
    db.close()