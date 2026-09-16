from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    customers,
    dashboard,
    machines,
    permissions,
    plants,
    roles,
    service_tickets,
    users, departments, notifications, ticket_history, spare_parts,
    inventory, stock_movements, ticket_spare_parts,sub_departments
)
from app.routers.ticket_comments import router as ticket_comments_router
from app.routers.ticket_comment_attachments import router as ticket_comment_attachments_router


app = FastAPI(
    title="ServiOps API",
    description="Service Operations Platform API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Core business APIs
app.include_router(customers.router)
app.include_router(plants.router)
app.include_router(machines.router)
app.include_router(service_tickets.router)

# Administration APIs
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(permissions.router)

# Dashboard APIs
app.include_router(dashboard.router)
#Department APIs
app.include_router(departments.router)
#Sub Department APIs
app.include_router(sub_departments.router)
#Notification APIs
app.include_router(notifications.router)
#Ticket History APIs
app.include_router(ticket_history.router)

# Spare Parts APIs
app.include_router(
    spare_parts.router
)
app.include_router(inventory.router)
app.include_router(stock_movements.router)
app.include_router(ticket_spare_parts.router)

# Ticket Comments APIs
app.include_router(ticket_comments_router)
app.include_router(ticket_comment_attachments_router)


@app.get("/")
def root():
    return {
        "message": "ServiOps API is running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
