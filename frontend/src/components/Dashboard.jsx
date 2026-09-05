import { useEffect, useState } from "react";
import api from "../api/client";

function Dashboard({ onNavigate, realtimeEvent }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/");

      setDashboard(response.data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);
useEffect(() => {
  if (!realtimeEvent) {
    return;
  }

  const dashboardEvents = [
    "BOOK_ADDED",
    "BOOK_UPDATED",
    "BOOK_DELETED",
    "BOOK_LENT",
    "BOOK_RETURNED",
    "SHELF_CREATED",
    "SHELF_BOOK_ADDED",
    "SHELF_BOOK_REMOVED",
    "SHELF_SHARED",
    "COLLABORATOR_ROLE_CHANGED",
    "COLLABORATOR_REMOVED",
    "ACTIVITY_CREATED",
  ];

  if (dashboardEvents.includes(realtimeEvent.type)) {
    loadDashboard();
  }
}, [realtimeEvent]);
  if (loading) {
    return (
      <section className="page-section">
        <div className="loading-card">
          <h2>📊 Dashboard</h2>
          <p>Loading your reading activity...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="error-message">
          {error}
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={loadDashboard}
        >
          Try Again
        </button>
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const books = dashboard.books || {};

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Your reading activity at a glance.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={() => onNavigate("books")}
        >
          + Add Book
        </button>
      </div>

      {/* Statistics */}

      <div className="stats-grid">
        <StatCard
          label="Total Books"
          value={books.total ?? 0}
          icon="📚"
        />

        <StatCard
          label="Want to Read"
          value={books.want_to_read ?? 0}
          icon="📖"
        />

        <StatCard
          label="Reading"
          value={books.reading ?? 0}
          icon="📕"
        />

        <StatCard
          label="Finished"
          value={books.finished ?? 0}
          icon="✅"
        />

        <StatCard
          label="Finished This Year"
          value={dashboard.finished_this_year ?? 0}
          icon="🏆"
        />

        <StatCard
          label="Average Rating"
          value={
            dashboard.average_rating !== null &&
            dashboard.average_rating !== undefined
              ? dashboard.average_rating
              : "—"
          }
          icon="⭐"
        />

        <StatCard
          label="Currently Lent"
          value={dashboard.currently_lent_out ?? 0}
          icon="🤝"
        />

        <StatCard
          label="Shared With Me"
          value={dashboard.shelves_shared_with_me ?? 0}
          icon="👥"
        />
      </div>

      {/* Lower dashboard */}

      <div className="dashboard-grid">
        {/* Largest Shelf */}

        <div className="dashboard-card">
          <div className="card-heading">
            <h2>📚 Largest Shelf</h2>
          </div>

          {dashboard.shelf_with_most_books ? (
            <div className="largest-shelf">
              <h3>
                {dashboard.shelf_with_most_books.name}
              </h3>

              <p>
                {
                  dashboard.shelf_with_most_books
                    .book_count
                }{" "}
                book
                {dashboard.shelf_with_most_books
                  .book_count !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <p>No shelves yet.</p>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => onNavigate("shelves")}
              >
                Create Shelf
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}

        <div className="dashboard-card">
          <div className="card-heading">
            <h2>⚡ Recent Activity</h2>

            <button
              type="button"
              className="text-btn"
              onClick={() => onNavigate("activity")}
            >
              View All
            </button>
          </div>

          {dashboard.recent_activity?.length > 0 ? (
            <div className="activity-list">
              {dashboard.recent_activity.map(
                (activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                  />
                )
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No recent activity.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------
// Statistic Card
// --------------------------------------------------

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Activity Item
// --------------------------------------------------

function ActivityItem({ activity }) {
  const date = activity.created_at
    ? new Date(activity.created_at).toLocaleString()
    : "";

  return (
    <div className="activity-item">
      <div className="activity-action">
        <strong>{activity.action}</strong>
      </div>

      <p>{activity.description}</p>

      <span className="activity-date">
        {date}
      </span>
    </div>
  );
}

export default Dashboard;
