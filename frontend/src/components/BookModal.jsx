import { useEffect, useState } from "react";
import api from "../api/client";

function BookModal({ book, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    status: "Want to Read",
    total_pages: "",
    rating: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(book);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title || "",
        author: book.author || "",
        status: book.status || "Want to Read",
        total_pages:
          book.total_pages !== null &&
          book.total_pages !== undefined
            ? String(book.total_pages)
            : "",
        rating:
          book.rating !== null &&
          book.rating !== undefined
            ? String(book.rating)
            : "",
        notes: book.notes || "",
      });
    } else {
      setForm({
        title: "",
        author: "",
        status: "Want to Read",
        total_pages: "",
        rating: "",
        notes: "",
      });
    }

    setError("");
  }, [book]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!form.author.trim()) {
      setError("Author is required.");
      return;
    }

    const totalPages = Number(form.total_pages);

    if (
      !Number.isInteger(totalPages) ||
      totalPages <= 0
    ) {
      setError(
        "Total pages must be a positive number."
      );
      return;
    }

    let rating = null;

    if (form.rating !== "") {
      rating = Number(form.rating);

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        setError("Rating must be between 1 and 5.");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        status: form.status,
        total_pages: totalPages,
        rating,
        notes: form.notes.trim() || null,
      };

      if (isEditing) {
        await api.put(
          `/books/${book.id}`,
          payload
        );
      } else {
        await api.post("/books/", payload);
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error("Book save error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to save book."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>
              {isEditing ? "Edit Book" : "Add Book"}
            </h2>

            <p>
              {isEditing
                ? "Update your book details."
                : "Add a new book to your reading library."}
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}

          <div className="form-group">
            <label htmlFor="book-title">
              Title
            </label>

            <input
              id="book-title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter book title"
              disabled={loading}
            />
          </div>

          {/* Author */}

          <div className="form-group">
            <label htmlFor="book-author">
              Author
            </label>

            <input
              id="book-author"
              name="author"
              type="text"
              value={form.author}
              onChange={handleChange}
              placeholder="Enter author name"
              disabled={loading}
            />
          </div>

          {/* Status + Pages */}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="book-status">
                Status
              </label>

              <select
                id="book-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={loading}
              >
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
            </div>

            <div className="form-group">
              <label htmlFor="book-pages">
                Total Pages
              </label>

              <input
                id="book-pages"
                name="total_pages"
                type="number"
                min="1"
                value={form.total_pages}
                onChange={handleChange}
                placeholder="e.g. 320"
                disabled={loading}
              />
            </div>
          </div>

          {/* Rating */}

          <div className="form-group">
            <label htmlFor="book-rating">
              Rating <span>(optional)</span>
            </label>

            <select
              id="book-rating"
              name="rating"
              value={form.rating}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">
                No rating
              </option>

              <option value="1">
                ⭐ 1
              </option>

              <option value="2">
                ⭐⭐ 2
              </option>

              <option value="3">
                ⭐⭐⭐ 3
              </option>

              <option value="4">
                ⭐⭐⭐⭐ 4
              </option>

              <option value="5">
                ⭐⭐⭐⭐⭐ 5
              </option>
            </select>
          </div>

          {/* Notes */}

          <div className="form-group">
            <label htmlFor="book-notes">
              Notes <span>(optional)</span>
            </label>

            <textarea
              id="book-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add your notes about this book..."
              rows="4"
              disabled={loading}
            />
          </div>

          {/* Error */}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* Buttons */}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookModal;