function SharedShelves({ shelves, onOpen }) {
  return (
    <div className="dashboard-card">
      <div className="card-heading">
        <h2>👥 Shared With Me</h2>
      </div>

      {!shelves || shelves.length === 0 ? (
        <div className="empty-state">
          <p>
            No one has shared a shelf with you yet.
          </p>
        </div>
      ) : (
        <div className="shelves-grid">
          {shelves.map((shelf) => (
            <article
              className="shelf-card shared"
              key={shelf.id}
            >
              <div className="shelf-card-header">
                <div>
                  <h3>📚 {shelf.name}</h3>

                  <p>
                    Shared shelf
                  </p>
                </div>

                <span
                  className={`status-badge ${
                    shelf.role === "editor"
                      ? "status-reading"
                      : "status-want"
                  }`}
                >
                  {shelf.role === "editor"
                    ? "Editor"
                    : "Viewer"}
                </span>
              </div>

              <button
                type="button"
                className="primary-small-btn"
                onClick={() => onOpen(shelf)}
              >
                Open Shelf
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharedShelves;