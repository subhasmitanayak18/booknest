import { useEffect, useState } from "react";
import api from "../api/client";
import ShelfModal from "./ShelfModal";
import SharedShelves from "./SharedShelves";
import ShelfDetails from "./ShelfDetails";

function Shelves({ onDataChange, realtimeEvent }) {
  const [shelves, setShelves] = useState([]);
  const [sharedShelves, setSharedShelves] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showShelfModal, setShowShelfModal] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState(null);

  const loadShelves = async () => {
    try {
      setLoading(true);
      setError("");

      const [ownedResponse, sharedResponse] =
        await Promise.all([
          api.get("/shelves/"),
          api.get("/shelves/shared-with-me"),
        ]);

      setShelves(ownedResponse.data);
      setSharedShelves(sharedResponse.data);
    } catch (err) {
      console.error("Shelves error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load shelves."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelves();
  }, []);

  useEffect(() => {
    if (!realtimeEvent) {
      return;
    }

    const shelfEvents = [
      "SHELF_BOOK_ADDED",
      "SHELF_BOOK_REMOVED",
      "SHELF_SHARED",
      "COLLABORATOR_ROLE_CHANGED",
      "COLLABORATOR_REMOVED",
    ];

    if (shelfEvents.includes(realtimeEvent.type)) {
      loadShelves();
    }
  }, [realtimeEvent]);

  const handleShelfCreated = async () => {
    setShowShelfModal(false);

    await loadShelves();

    if (onDataChange) {
      onDataChange();
    }
  };

  const handleShelfDeleted = async () => {
    setSelectedShelf(null);

    await loadShelves();

    if (onDataChange) {
      onDataChange();
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="loading-card">
          <h2>Shelves</h2>
          <p>Loading your shelves...</p>
        </div>
      </section>
    );
  }

  if (selectedShelf) {
    return (
      <ShelfDetails
        shelf={selectedShelf}
        onBack={() => setSelectedShelf(null)}
        onDataChange={async () => {
          await loadShelves();

          if (onDataChange) {
            onDataChange();
          }
        }}
        realtimeEvent={realtimeEvent}
      />
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Shelves</h1>
          <p>
            Organize your books and collaborate with others.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={() => setShowShelfModal(true)}
        >
          Create Shelf
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-card">
        <div className="card-heading">
          <div>
            <h2>My Shelves</h2>
            <p className="section-description">
              Your personal book collections.
            </p>
          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={loadShelves}
          >
            Refresh
          </button>
        </div>

        {shelves.length === 0 ? (
          <div className="empty-state">
            <p>
              You haven't created any shelves yet.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowShelfModal(true)}
            >
              Create Your First Shelf
            </button>
          </div>
        ) : (
          <div className="shelves-grid">
            {shelves.map((shelf) => (
              <article
                className="shelf-card"
                key={shelf.id}
                onClick={() => setSelectedShelf(shelf)}
              >
                <div className="shelf-card-header">
                  <div>
                    <h3>{shelf.name}</h3>

                    <p>
                      Created{" "}
                      {shelf.created_at
                        ? new Date(
                            shelf.created_at
                          ).toLocaleDateString()
                        : ""}
                    </p>
                  </div>

                  <span className="status-badge status-reading">
                    Owner
                  </span>
                </div>

                <button
                  type="button"
                  className="primary-small-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedShelf(shelf);
                  }}
                >
                  Open Shelf
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <SharedShelves
        shelves={sharedShelves}
        onOpen={setSelectedShelf}
      />

      {showShelfModal && (
        <ShelfModal
          onClose={() => setShowShelfModal(false)}
          onSaved={handleShelfCreated}
        />
      )}
    </section>
  );
}

export default Shelves;