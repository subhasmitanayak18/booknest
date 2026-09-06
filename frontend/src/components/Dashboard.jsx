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
          <h2>Dashboard</h2>
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
    <section className="page-section dashboard-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            YOUR LIBRARY
          </span>

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
          Add Book
        </button>
      </div>


      {/* =========================
          LIBRARY OVERVIEW
      ========================= */}

      <section className="overview-section">

        <div className="section-label">
          LIBRARY OVERVIEW
        </div>

        <div className="stats-grid dashboard-stats">

          <StatCard
            label="Total Books"
            value={books.total ?? 0}
          />

          <StatCard
            label="Want to Read"
            value={books.want_to_read ?? 0}
          />

          <StatCard
            label="Reading"
            value={books.reading ?? 0}
          />

          <StatCard
            label="Finished"
            value={books.finished ?? 0}
          />

        </div>

      </section>


      {/* =========================
          SECONDARY STATISTICS
      ========================= */}

      <div className="secondary-stats">

        <MiniStat
          label="Finished This Year"
          value={dashboard.finished_this_year ?? 0}
        />

        <MiniStat
          label="Average Rating"
          value={
            dashboard.average_rating !== null &&
            dashboard.average_rating !== undefined
              ? dashboard.average_rating
              : "—"
          }
        />

        <MiniStat
          label="Currently Lent"
          value={dashboard.currently_lent_out ?? 0}
        />

        <MiniStat
          label="Shared With Me"
          value={dashboard.shelves_shared_with_me ?? 0}
        />

      </div>


      {/* =========================
          LIBRARY HIGHLIGHTS
      ========================= */}

      <div className="dashboard-grid dashboard-highlights">

        {/* LARGEST SHELF */}

        <div className="dashboard-card library-highlight">

          <div className="card-heading">
            <div>
              <span className="section-label">
                YOUR LIBRARY
              </span>

              <h2>Largest Shelf</h2>
            </div>
          </div>

          {dashboard.shelf_with_most_books ? (

            <div className="largest-shelf">

              <span className="highlight-label">
                MOST BOOKS
              </span>

              <h3>
                {dashboard.shelf_with_most_books.name}
              </h3>

              <div className="shelf-count-display">
                <strong>
                  {dashboard.shelf_with_most_books.book_count}
                </strong>

                <span>
                  {dashboard.shelf_with_most_books.book_count === 1
                    ? "book"
                    : "books"}
                </span>
              </div>

              <button
                type="button"
                className="text-btn"
                onClick={() => onNavigate("shelves")}
              >
                View Shelves
                <span aria-hidden="true"> →</span>
              </button>

            </div>

          ) : (

            <div className="empty-state dashboard-empty">

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


        {/* READING STATUS */}

        <div className="dashboard-card reading-summary">

          <div className="card-heading">
            <div>
              <span className="section-label">
                READING
              </span>

              <h2>Reading Status</h2>
            </div>

            <button
              type="button"
              className="text-btn"
              onClick={() => onNavigate("books")}
            >
              My Books
            </button>
          </div>

          <div className="reading-status-content">

            <ReadingStatus
              label="Want to Read"
              value={books.want_to_read ?? 0}
              className="want"
            />

            <ReadingStatus
              label="Currently Reading"
              value={books.reading ?? 0}
              className="reading"
            />

            <ReadingStatus
              label="Finished"
              value={books.finished ?? 0}
              className="finished"
            />

          </div>

        </div>

      </div>


      {/* =========================
          RECENT ACTIVITY
      ========================= */}

      <div className="dashboard-card activity-card">

        <div className="card-heading">

          <div>
            <span className="section-label">
              TIMELINE
            </span>

            <h2>Recent Activity</h2>
          </div>

          <button
            type="button"
            className="text-btn"
            onClick={() => onNavigate("activity")}
          >
            View All
            <span aria-hidden="true"> →</span>
          </button>

        </div>

        {dashboard.recent_activity?.length > 0 ? (

          <div className="activity-list">

            {dashboard.recent_activity.map((activity) => (

              <ActivityItem
                key={activity.id}
                activity={activity}
              />

            ))}

          </div>

        ) : (

          <div className="empty-state">
            <p>No recent activity.</p>
          </div>

        )}

      </div>

    </section>
  );
}


/* =========================
   STAT CARD
========================= */

function StatCard({ label, value }) {
  return (
    <div className="stat-card">

      <div className="stat-content">

        <span className="stat-label">
          {label}
        </span>

        <strong className="stat-value">
          {value}
        </strong>

      </div>

    </div>
  );
}


/* =========================
   MINI STAT
========================= */

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">

      <span className="mini-stat-label">
        {label}
      </span>

      <strong className="mini-stat-value">
        {value}
      </strong>

    </div>
  );
}


/* =========================
   READING STATUS
========================= */

function ReadingStatus({ label, value, className }) {
  return (
    <div className={`reading-status ${className}`}>

      <div className="reading-status-indicator" />

      <div className="reading-status-info">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


/* =========================
   ACTIVITY ITEM
========================= */

function ActivityItem({ activity }) {
  const date = activity.created_at
    ? new Date(activity.created_at).toLocaleString()
    : "";

  return (
    <div className="activity-item">

      <div className="activity-marker" />

      <div className="activity-content">

        <span className="activity-type">
          {activity.action}
        </span>

        <p className="activity-description">
          {activity.description}
        </p>

        <span className="activity-date">
          {date}
        </span>

      </div>

    </div>
  );
}


export default Dashboard;