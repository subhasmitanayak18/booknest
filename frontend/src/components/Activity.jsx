import { useEffect, useState } from "react";
import api from "../api/client";

function Activity({realtimeEvent}){
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/activity/");

      setActivities(response.data);
    } catch (err) {
      console.error("Activity error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load activity."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);
useEffect(() => {
  if (!realtimeEvent) {
    return;
  }

  if (realtimeEvent.type === "ACTIVITY_CREATED") {
    loadActivity();
  }
}, [realtimeEvent]);
  if (loading) {
    return (
      <section className="page-section">
        <h1>Activity</h1>
        <p>Loading activity...</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Activity</h1>
          <p>Your recent BookNest activity.</p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={loadActivity}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!error && activities.length === 0 && (
        <div className="dashboard-card empty-state">
          <p>No activity yet.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="dashboard-card">
          <div className="activity-list">
            {activities.map((activity) => (
              <div
                className="activity-item"
                key={activity.id}
              >
                <div className="activity-action">
                  <strong>{activity.action}</strong>
                </div>

                <p>{activity.description}</p>

                <span className="activity-date">
                  {activity.created_at
                    ? new Date(
                        activity.created_at
                      ).toLocaleString()
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Activity;