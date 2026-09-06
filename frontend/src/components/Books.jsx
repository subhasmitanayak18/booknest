import { useEffect, useState } from "react";
import api from "../api/client";
import BookModal from "./BookModal";

function Books({ onDataChange }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date_added");
  const [sortOrder, setSortOrder] = useState("desc");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [updatingProgressId, setUpdatingProgressId] = useState(null);
  const [progressValues, setProgressValues] = useState({});

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/books/", {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });

      setBooks(response.data);
    } catch (err) {
      console.error("Books error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load books."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [search, statusFilter, sortBy, sortOrder, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleAddBook = () => {
    setEditingBook(null);
    setShowModal(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowModal(true);
  };

  const handleDeleteBook = async (bookId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this book?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(bookId);

      await api.delete(`/books/${bookId}`);

      await loadBooks();

      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      console.error("Delete error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete book."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleProgressUpdate = async (bookId) => {
    const currentPage = Number(progressValues[bookId]);

    if (!Number.isInteger(currentPage) || currentPage < 0) {
      setError(
        "Current page must be a non-negative whole number."
      );
      return;
    }

    try {
      setUpdatingProgressId(bookId);
      setError("");

      await api.put(`/books/${bookId}/progress`, {
        current_page: currentPage,
      });

      await loadBooks();

      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      console.error("Progress update error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to update reading progress."
      );
    } finally {
      setUpdatingProgressId(null);
    }
  };

  const handleProgressChange = (bookId, value) => {
    setProgressValues((current) => ({
      ...current,
      [bookId]: value,
    }));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBook(null);
  };

  const handleBookSaved = async () => {
    handleModalClose();

    await loadBooks();

    if (onDataChange) {
      onDataChange();
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSortBy("date_added");
    setSortOrder("desc");
    setPage(1);
  };

  const canGoPrevious = page > 1;
  const canGoNext = books.length === pageSize;

  return (
    <section className="page-section">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>My Books</h1>
          <p>
            Manage your personal reading library.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleAddBook}
        >
          + Add Book
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="books-toolbar">

        <div className="books-search">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              handleSearchChange(event.target.value)
            }
            placeholder="Search by title or author"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            handleStatusChange(event.target.value)
          }
        >
          <option value="">All Statuses</option>

          <option value="Want to Read">
            Want to Read
          </option>

          <option value="Reading">
            Reading
          </option>

          <option value="Finished">
            Finished
          </option>
        </select>

        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            setPage(1);
          }}
        >
          <option value="date_added">
            Date Added
          </option>

          <option value="title">
            Title
          </option>

          <option value="rating">
            Rating
          </option>
        </select>

        <select
          value={sortOrder}
          onChange={(event) => {
            setSortOrder(event.target.value);
            setPage(1);
          }}
        >
          <option value="desc">
            Descending
          </option>

          <option value="asc">
            Ascending
          </option>
        </select>

        {(search || statusFilter) && (
          <button
            type="button"
            className="clear-btn"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}

      </div>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (

        <div className="loading-card">
          <p>Loading books...</p>
        </div>

      ) : books.length === 0 ? (

        <div className="dashboard-card empty-state">

          <h3>No books found</h3>

          <p>
            Try changing your search or filters,
            or add your first book.
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={handleAddBook}
          >
            + Add Book
          </button>

        </div>

      ) : (

        <>

          {/* BOOK GRID */}
          <div className="books-grid">

            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
                deleting={deletingId === book.id}
                progressValue={
                  progressValues[book.id] ??
                  book.current_page ??
                  0
                }
                onProgressChange={
                  handleProgressChange
                }
                onProgressUpdate={
                  handleProgressUpdate
                }
                updatingProgress={
                  updatingProgressId === book.id
                }
              />
            ))}

          </div>

          {/* PAGINATION */}
          <div className="pagination">

            <button
              type="button"
              disabled={!canGoPrevious}
              onClick={() =>
                setPage(
                  (current) => current - 1
                )
              }
            >
              ← Previous
            </button>

            <span>
              Page {page}
            </span>

            <button
              type="button"
              disabled={!canGoNext}
              onClick={() =>
                setPage(
                  (current) => current + 1
                )
              }
            >
              Next →
            </button>

          </div>

        </>
      )}

      {/* BOOK MODAL */}
      {showModal && (
        <BookModal
          book={editingBook}
          onClose={handleModalClose}
          onSaved={handleBookSaved}
        />
      )}

    </section>
  );
}


/* ==================================================
   BOOK CARD
================================================== */

function BookCard({
  book,
  onEdit,
  onDelete,
  deleting,
  progressValue,
  onProgressChange,
  onProgressUpdate,
  updatingProgress,
}) {
  const progress =
    book.total_pages > 0 &&
    book.current_page != null
      ? Math.min(
          100,
          Math.round(
            (book.current_page /
              book.total_pages) *
              100
          )
        )
      : 0;

  return (
    <article className="book-card">

      <div className="book-card-header">

        <div className="book-title-area">

          <h3>
            {book.title}
          </h3>

          <p className="book-author">
            {book.author}
          </p>

        </div>

        <span
          className={`status-badge ${getStatusClass(
            book.status
          )}`}
        >
          {book.status}
        </span>

      </div>

      {/* BOOK DETAILS */}
      <div className="book-details">

        <div className="book-detail-row">
          <span>Pages</span>

          <strong>
            {book.total_pages}
          </strong>
        </div>

        {book.rating != null && (
          <div className="book-detail-row">

            <span>Rating</span>

            <strong>
              {book.rating}/5
            </strong>

          </div>
        )}

        {book.notes && (
          <p className="book-notes">
            {book.notes}
          </p>
        )}

      </div>

      {/* READING PROGRESS */}
      {book.status === "Reading" && (

        <div className="progress-section">

          <div className="progress-header">

            <span>
              Reading Progress
            </span>

            <strong>
              {book.current_page ?? 0}/
              {book.total_pages}
            </strong>

          </div>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="progress-percentage">
            {progress}% complete
          </div>

          <div className="progress-update">

            <input
              type="number"
              min="0"
              max={book.total_pages}
              value={progressValue}
              onChange={(event) =>
                onProgressChange(
                  book.id,
                  event.target.value
                )
              }
              disabled={updatingProgress}
            />

            <button
              type="button"
              className="primary-small-btn"
              disabled={updatingProgress}
              onClick={() =>
                onProgressUpdate(book.id)
              }
            >
              {updatingProgress
                ? "Updating..."
                : "Update"}
            </button>

          </div>

        </div>
      )}

      {/* ACTIONS */}
      <div className="book-actions">

        <button
          type="button"
          className="edit-btn"
          onClick={() => onEdit(book)}
        >
          Edit
        </button>

        <button
          type="button"
          className="delete-btn"
          disabled={deleting}
          onClick={() =>
            onDelete(book.id)
          }
        >
          {deleting
            ? "Deleting..."
            : "Delete"}
        </button>

      </div>

    </article>
  );
}


/* ==================================================
   HELPERS
================================================== */

function getStatusClass(status) {
  if (status === "Reading") {
    return "status-reading";
  }

  if (status === "Finished") {
    return "status-finished";
  }

  return "status-want";
}


export default Books;