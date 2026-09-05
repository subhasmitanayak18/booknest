import { useEffect, useState } from "react";
import api from "../api/client";

function ShelfDetails({
  shelf,
  onBack,
  onDataChange,
  realtimeEvent,
}) {
  const [details, setDetails] = useState(null);
  const [books, setBooks] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showShareForm, setShowShareForm] = useState(false);

  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("viewer");

  const [shareLoading, setShareLoading] = useState(false);

  const [selectedBookId, setSelectedBookId] = useState("");

  const [addingBook, setAddingBook] = useState(false);

  const [removingBookId, setRemovingBookId] = useState(null);

  const [deletingShelf, setDeletingShelf] = useState(false);

  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const [removingCollaboratorId, setRemovingCollaboratorId] =
    useState(null);

  const loadShelf = async () => {
    if (!shelf?.id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/shelves/${shelf.id}`
      );

      setDetails(response.data);

      setBooks(response.data.books || []);

      setCollaborators(
        response.data.collaborators || []
      );

      const booksResponse = await api.get("/books/", {
        params: {
          page: 1,
          page_size: 100,
        },
      });

      setAvailableBooks(booksResponse.data);
    } catch (err) {
      console.error(
        "Shelf details error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load shelf."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelf();
  }, [shelf?.id]);

  // Handle realtime shelf updates
  useEffect(() => {
    if (!realtimeEvent || !shelf?.id) {
      return;
    }

    console.log(
      "Shelf realtime event:",
      realtimeEvent
    );

    const shelfEvents = [
      "SHELF_BOOK_ADDED",
      "SHELF_BOOK_REMOVED",
      "SHELF_SHARED",
      "COLLABORATOR_ROLE_CHANGED",
      "COLLABORATOR_REMOVED",
    ];

    if (
      !shelfEvents.includes(
        realtimeEvent.type
      )
    ) {
      return;
    }

    const eventShelfId =
      realtimeEvent.data?.shelf_id ??
      realtimeEvent.shelf_id;

    if (
      Number(eventShelfId) ===
      Number(shelf.id)
    ) {
      console.log(
        "Refreshing shelf because of realtime event:",
        realtimeEvent.type
      );

      loadShelf();
    }
  }, [realtimeEvent, shelf?.id]);

  const role =
    details?.role ||
    shelf?.role;

  const isOwner =
    details?.owner_id !== undefined
      ? details.owner_id ===
        details.current_user_id
      : role === "owner";

  const canEdit =
    role === "owner" ||
    role === "editor";

  const handleAddBook = async () => {
    if (!selectedBookId) {
      return;
    }

    try {
      setAddingBook(true);
      setError("");

      await api.post(
        `/shelves/${shelf.id}/books/${selectedBookId}`
      );

      setSelectedBookId("");

      await loadShelf();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      console.error(
        "Add to shelf error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to add book to shelf."
      );
    } finally {
      setAddingBook(false);
    }
  };

  const handleRemoveBook = async (
    bookId
  ) => {
    const confirmed = window.confirm(
      "Remove this book from the shelf?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingBookId(bookId);
      setError("");

      await api.delete(
        `/shelves/${shelf.id}/books/${bookId}`
      );

      await loadShelf();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      console.error(
        "Remove from shelf error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to remove book from shelf."
      );
    } finally {
      setRemovingBookId(null);
    }
  };

  const handleShare = async (
    event
  ) => {
    event.preventDefault();

    if (!shareEmail.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setShareLoading(true);
      setError("");

      await api.post(
        `/shelves/${shelf.id}/share`,
        {
          email: shareEmail.trim(),
          role: shareRole,
        }
      );

      setShareEmail("");
      setShareRole("viewer");
      setShowShareForm(false);

      await loadShelf();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      console.error(
        "Share shelf error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to share shelf."
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleRoleChange = async (
    collaborator
  ) => {
    const newRole =
      collaborator.role === "editor"
        ? "viewer"
        : "editor";

    try {
      setUpdatingRoleId(
        collaborator.user_id
      );

      setError("");

      await api.put(
        `/shelves/${shelf.id}/collaborators/${collaborator.user_id}`,
        {
          role: newRole,
        }
      );

      await loadShelf();

      if (onDataChange) {
        await onDataChange();
      }
    } catch (err) {
      console.error(
        "Role update error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to update collaborator role."
      );
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveCollaborator =
    async (collaborator) => {
      const confirmed = window.confirm(
        "Remove this collaborator from the shelf?"
      );

      if (!confirmed) {
        return;
      }

      try {
        setRemovingCollaboratorId(
          collaborator.user_id
        );

        setError("");

        await api.delete(
          `/shelves/${shelf.id}/collaborators/${collaborator.user_id}`
        );

        await loadShelf();

        if (onDataChange) {
          await onDataChange();
        }
      } catch (err) {
        console.error(
          "Remove collaborator error:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to remove collaborator."
        );
      } finally {
        setRemovingCollaboratorId(null);
      }
    };

  const handleDeleteShelf =
    async () => {
      const confirmed = window.confirm(
        `Delete shelf "${shelf.name}"? The books will not be deleted.`
      );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingShelf(true);
        setError("");

        await api.delete(
          `/shelves/${shelf.id}`
        );

        if (onDataChange) {
          await onDataChange();
        }

        onBack();
      } catch (err) {
        console.error(
          "Delete shelf error:",
          err
        );

        setError(
          err.response?.data?.detail ||
            "Unable to delete shelf."
        );
      } finally {
        setDeletingShelf(false);
      }
    };

  if (loading) {
    return (
      <section className="page-section">
        <button
          type="button"
          className="secondary-btn"
          onClick={onBack}
        >
          ← Back to Shelves
        </button>

        <div className="loading-card">
          <p>Loading shelf...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section shelf-detail">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-btn"
            onClick={onBack}
          >
            ← Back to Shelves
          </button>

          <h1>{shelf.name}</h1>

          <p>
            {role === "owner"
              ? "You own this shelf."
              : role === "editor"
              ? "You can edit this shared shelf."
              : "You have read-only access to this shelf."}
          </p>
        </div>

        {role === "owner" && (
          <button
            type="button"
            className="delete-btn"
            disabled={deletingShelf}
            onClick={handleDeleteShelf}
          >
            {deletingShelf
              ? "Deleting..."
              : "Delete Shelf"}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Books */}

      <div className="dashboard-card">
        <div className="card-heading">
          <h2>📚 Books</h2>
        </div>

        {canEdit && (
          <div className="add-to-shelf">
            <select
              value={selectedBookId}
              onChange={(event) =>
                setSelectedBookId(
                  event.target.value
                )
              }
              disabled={addingBook}
            >
              <option value="">
                Select a book to add
              </option>

              {availableBooks
                .filter(
                  (book) =>
                    !books.some(
                      (shelfBook) =>
                        shelfBook.id ===
                        book.id
                    )
                )
                .map((book) => (
                  <option
                    key={book.id}
                    value={book.id}
                  >
                    {book.title} —{" "}
                    {book.author}
                  </option>
                ))}
            </select>

            <button
              type="button"
              className="primary-small-btn"
              disabled={
                !selectedBookId ||
                addingBook
              }
              onClick={handleAddBook}
            >
              {addingBook
                ? "Adding..."
                : "Add Book"}
            </button>
          </div>
        )}

        {books.length === 0 ? (
          <div className="empty-state">
            <p>
              This shelf has no books yet.
            </p>
          </div>
        ) : (
          <div className="shelf-books">
            {books.map((book) => (
              <div
                className="shelf-book"
                key={book.id}
              >
                <div>
                  <h3>{book.title}</h3>

                  <p>{book.author}</p>

                  <span
                    className={`status-badge ${getStatusClass(
                      book.status
                    )}`}
                  >
                    {book.status}
                  </span>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    className="delete-btn"
                    disabled={
                      removingBookId ===
                      book.id
                    }
                    onClick={() =>
                      handleRemoveBook(
                        book.id
                      )
                    }
                  >
                    {removingBookId ===
                    book.id
                      ? "Removing..."
                      : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sharing */}

      {role === "owner" && (
        <div className="dashboard-card">
          <div className="card-heading">
            <h2>👥 Collaborators</h2>

            <button
              type="button"
              className="primary-small-btn"
              onClick={() =>
                setShowShareForm(
                  (current) => !current
                )
              }
            >
              {showShareForm
                ? "Cancel"
                : "Share Shelf"}
            </button>
          </div>

          {showShareForm && (
            <form
              className="share-form"
              onSubmit={handleShare}
            >
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(event) =>
                      setShareEmail(
                        event.target.value
                      )
                    }
                    placeholder="user@example.com"
                    disabled={
                      shareLoading
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>

                  <select
                    value={shareRole}
                    onChange={(event) =>
                      setShareRole(
                        event.target.value
                      )
                    }
                    disabled={
                      shareLoading
                    }
                  >
                    <option value="viewer">
                      Viewer
                    </option>

                    <option value="editor">
                      Editor
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={shareLoading}
              >
                {shareLoading
                  ? "Sharing..."
                  : "Share Shelf"}
              </button>
            </form>
          )}

          {collaborators.length === 0 ? (
            <div className="empty-state">
              <p>
                No collaborators yet.
              </p>
            </div>
          ) : (
            <div className="collaborators-list">
              {collaborators.map(
                (collaborator) => (
                  <div
                    className="collaborator-row"
                    key={collaborator.id}
                  >
                    <div>
                      <strong>
                        {
                          collaborator.name
                        }
                      </strong>

                      <span
                        className={`status-badge ${
                          collaborator.role ===
                          "editor"
                            ? "status-reading"
                            : "status-want"
                        }`}
                      >
                        {
                          collaborator.role
                        }
                      </span>
                    </div>

                    <div className="shelf-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        disabled={
                          updatingRoleId ===
                          collaborator.user_id
                        }
                        onClick={() =>
                          handleRoleChange(
                            collaborator
                          )
                        }
                      >
                        {updatingRoleId ===
                        collaborator.user_id
                          ? "Updating..."
                          : collaborator.role ===
                            "editor"
                          ? "Make Viewer"
                          : "Make Editor"}
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        disabled={
                          removingCollaboratorId ===
                          collaborator.user_id
                        }
                        onClick={() =>
                          handleRemoveCollaborator(
                            collaborator
                          )
                        }
                      >
                        {removingCollaboratorId ===
                        collaborator.user_id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function getStatusClass(status) {
  if (status === "Reading") {
    return "status-reading";
  }

  if (status === "Finished") {
    return "status-finished";
  }

  return "status-want";
}

export default ShelfDetails;