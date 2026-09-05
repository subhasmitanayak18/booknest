import { useState } from "react";
import api from "../api/client";

function ShelfModal({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Shelf name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Shelf name must be 100 characters or less.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/shelves/", {
        name: trimmedName,
      });

      if (onSaved) {
        onSaved();
      }

      onClose();
    } catch (err) {
      console.error("Failed to create shelf:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to create shelf. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Shelf</h2>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="shelf-name">Shelf Name</label>

            <input
              id="shelf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Favorites, To Re-read"
              disabled={saving}
              autoFocus
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-small-btn"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Shelf"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShelfModal;