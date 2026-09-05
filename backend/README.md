# BookNest

A full-stack reading tracker for managing books, organizing personal and shared shelves, tracking reading progress, lending books, and receiving real-time updates.

---

## What is BookNest?

BookNest helps readers keep their entire reading collection organized in one place.

With BookNest, you can:

- Add, edit, search, and manage books
- Track books as Want to Read, Reading, or Finished
- Track reading progress and automatically finish books
- Organize books into custom shelves
- Share shelves with other users
- Give collaborators Editor or Viewer access
- Lend books to other registered users
- Track borrowed and lent books
- View a personal activity history
- Receive real-time updates through WebSockets
- See reading statistics from the dashboard

---

## Tech Stack

**Frontend**
- React
- Vite
- Axios
- CSS

**Backend**
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- bcrypt
- WebSockets

---

## Key Features

### Book Management

Each book can contain:

- Title
- Author
- Reading status
- Total pages
- Current page
- Rating (1–5)
- Notes
- Date added
- Finished date

Books can be searched by title or author and filtered by reading status.

The book list supports server-side pagination and sorting.

---

### Custom Shelves

Create custom shelves and organize books however you want.

A book can belong to multiple shelves, and deleting a shelf does not delete the books inside it.

---

### Shared Shelves

Shelves can be shared with registered BookNest users.

There are three roles:

| Role | Permissions |
|------|-------------|
| Owner | Full control |
| Editor | Add and remove books |
| Viewer | Read-only access |

Only the shelf owner can:

- Share a shelf
- Change collaborator roles
- Remove collaborators
- Delete the shelf

Authorization is enforced on the backend.

---

### Reading Progress

For books currently being read, users can update their current page.

BookNest validates that:

- The page cannot be negative
- The page cannot exceed the total number of pages
- Progress cannot be updated when total pages are unavailable

When the current page reaches the total page count, the book is automatically marked as **Finished** and the finish date is recorded.

---

### Lending

Users can lend books they own to other registered users.

The system prevents:

- Lending a book the user does not own
- Lending a book to themselves
- Lending a book that is already out
- Lending to a non-existent user

Borrowers get a read-only view of books currently borrowed from them.

The owner can mark a lent book as returned.

---

### Activity Feed

BookNest records important actions such as:

- Book added
- Book status changed
- Book lent
- Book returned
- Shelf shared
- Collaborator role changed
- Collaborator removed

Activities are displayed in reverse chronological order.

---

### Real-Time Updates

BookNest uses authenticated WebSocket connections for live updates.

Real-time events are used for:

- Lending and returns
- Shared shelf changes
- Collaborator changes
- Activity updates
- Dashboard updates

WebSocket connections are authenticated using JWT access tokens and events are scoped to the appropriate users.

The application does not rely on polling for real-time functionality.

---

## Authentication & Security

BookNest uses JWT-based authentication.

### Token Configuration

| Token | Lifetime |
|-------|----------|
| Access Token | 15 minutes |
| Refresh Token | 7 days |

When an access token expires, the frontend automatically uses the refresh token to obtain a new access token and retries the failed request.

Passwords are securely hashed using **bcrypt** and are never stored as plaintext.

Protected API endpoints require authentication, and backend authorization checks ensure users can only access resources they are permitted to access.

---

## Dashboard

The dashboard provides an overview of your reading activity, including:

- Total books
- Want to Read count
- Reading count
- Finished count
- Books finished this year
- Average rating
- Currently lent books
- Shelves shared with you
- Shelf containing the most books
- Recent activity

---

# Getting Started

## Prerequisites

Make sure you have:

- Python 3.10+
- Node.js and npm
- PostgreSQL

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd booknest