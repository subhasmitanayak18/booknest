# BookNest

BookNest is a full-stack reading tracker application for managing books, custom shelves, reading progress, lending, shared shelves, activity history, and real-time updates.

## Features

### Authentication

- User registration with name, email, and password
- Email validation
- Password hashing using bcrypt
- JWT-based authentication
- Short-lived access tokens
- Longer-lived refresh tokens
- Automatic access-token refresh on expiration
- Protected backend endpoints
- Logout support

### Book Management

- Add, edit, delete, and list books
- Reading status:
  - Want to Read
  - Reading
  - Finished
- Total page count
- Optional rating from 1 to 5
- Optional notes
- Search by title or author
- Filter by reading status
- Combined search and status filtering
- Server-side pagination
- Server-side sorting by:
  - Title
  - Rating
  - Date added

### Reading Progress

- Track current page for books being read
- Display reading progress percentage
- Prevent negative page numbers
- Prevent progress beyond the total page count
- Prevent progress updates when total pages are not set
- Automatically marks a book as `Finished` when the current page reaches the total page count
- Records the completion date

### Custom Shelves

- Create custom shelves
- Add books to shelves
- Remove books from shelves
- Delete shelves without deleting books
- Many-to-many relationship between books and shelves
- Deleting a book cleans up its shelf relationships

### Shared Shelves and RBAC

Shelves can be shared with other registered users.

Supported roles:

- **Owner**
  - Full control over the shelf
  - Add/remove books
  - Share the shelf
  - Change collaborator roles
  - Remove collaborators
  - Delete the shelf
- **Editor**
  - View the shared shelf
  - Add books
  - Remove books
- **Viewer**
  - Read-only access to the shared shelf

All permissions are enforced on the backend.

### Lending

- Lend owned books to registered users
- Borrowed-books view
- Prevent lending a book that is already lent out
- Prevent self-lending
- Prevent lending books that the current user does not own
- Owner can mark books as returned
- Borrowers have read-only access to borrowed books

### Activity Feed

The application records important actions such as:

- Book added
- Reading status changed
- Book lent
- Book returned
- Shelf shared
- Collaborator role changed
- Collaborator removed

Activities are displayed in reverse chronological order.

### Real-Time Updates

BookNest uses WebSockets for live updates without polling.

Real-time events include:

- Book lending
- Book returns
- Shared shelf changes
- Collaborator role changes
- Collaborator removal
- Activity creation

WebSocket connections are authenticated using access tokens and events are scoped to the appropriate users and shared shelves.

### Dashboard

The dashboard provides:

- Total books
- Want to Read count
- Reading count
- Finished count
- Books finished this year
- Average rating
- Shelf containing the most books
- Currently lent-out books
- Shelves shared with the current user
- Recent activity

### Frontend UX

- Responsive layout
- Loading states
- Error states
- Inline validation
- Disabled buttons during in-flight requests
- Automatic token refresh and request retry

---

## Tech Stack

### Frontend

- React
- Vite
- Axios
- WebSockets
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT
- bcrypt
- WebSockets

---

## Project Structure

```text
booknest/
├── backend/
│   ├── app/
│   │   ├── dependencies/
│   │   ├── routers/
│   │   ├── activity.py
│   │   ├── database.py
│   │   ├── event_utils.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── realtime.py
│   │   ├── schemas.py
│   │   └── security.py
│   ├── .env.example
│   ├── requirements.txt
│   └── seed.py
│
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── hooks/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── package-lock.json