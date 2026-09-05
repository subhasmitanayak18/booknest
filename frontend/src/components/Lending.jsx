import { useEffect, useState } from "react";
import api from "../api/client";

function Lending({ realtimeEvent }) {
  const [loans, setLoans] = useState([]);
const [borrowedBooks, setBorrowedBooks] = useState([]);
const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [returningId, setReturningId] = useState(null);
const [selectedBookId, setSelectedBookId] = useState("");
const [borrowerEmail, setBorrowerEmail] = useState("");
const [lending, setLending] = useState(false);
  const loadLoans = async () => {
    try {
      setLoading(true);
      setError("");
const [loansResponse, borrowedResponse, booksResponse] =
  await Promise.all([
    api.get("/loans/"),
    api.get("/loans/borrowed"),
    api.get("/books/", {
      params: {
        page: 1,
        page_size: 100,
      },
    }),
  ]);

      setLoans(loansResponse.data);
      setBorrowedBooks(borrowedResponse.data);
      setBooks(booksResponse.data);
    } catch (err) {
      console.error("Lending error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load lending information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);
useEffect(() => {
  if (!realtimeEvent) {
    return;
  }

  const lendingEvents = [
    "BOOK_LENT",
    "BOOK_RETURNED",
  ];

  if (lendingEvents.includes(realtimeEvent.type)) {
    loadLoans();
  }
}, [realtimeEvent]);
const handleLend = async (e) => {
  e.preventDefault();

  if (!selectedBookId || !borrowerEmail.trim()) {
    setError("Please select a book and enter the borrower's email.");
    return;
  }

  try {
    setLending(true);
    setError("");

    await api.post(`/loans/${selectedBookId}`, {
      borrower_email: borrowerEmail.trim(),
    });

    setSelectedBookId("");
    setBorrowerEmail("");

    await loadLoans();
  } catch (err) {
    console.error("Lend error:", err);

    setError(
      err.response?.data?.detail ||
        "Unable to lend book."
    );
  } finally {
    setLending(false);
  }
};
  const handleReturn = async (loanId) => {
    const confirmed = window.confirm(
      "Mark this book as returned?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setReturningId(loanId);
      setError("");

      await api.put(`/loans/${loanId}/return`);

      await loadLoans();
    } catch (err) {
      console.error("Return error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to return book."
      );
    } finally {
      setReturningId(null);
    }
  };

  if (loading) {
    return (
      <section className="page-section">
        <div className="loading-card">
          <h2>🤝 Lending</h2>
          <p>Loading lending information...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Lending</h1>
          <p>
            Manage books you have lent and books borrowed
            from others.
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={loadLoans}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

<div className="dashboard-card">
  <div className="card-heading">
    <h2>📤 Lend a Book</h2>
  </div>

  <form onSubmit={handleLend}>
    <div className="form-group">
      <label>Select Book</label>
      <select
        value={selectedBookId}
        onChange={(e) => setSelectedBookId(e.target.value)}
        disabled={lending}
      >
        <option value="">Select a book</option>

        {books.map((book) => (
          <option key={book.id} value={book.id}>
            {book.title} — {book.author}
          </option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label>Borrower's Email</label>
      <input
        type="email"
        value={borrowerEmail}
        onChange={(e) => setBorrowerEmail(e.target.value)}
        placeholder="user@example.com"
        disabled={lending}
      />
    </div>

    <button
      type="submit"
      className="primary-btn"
      disabled={lending}
    >
      {lending ? "Lending..." : "Lend Book"}
    </button>
  </form>
</div>
      <div className="dashboard-card">
        <div className="card-heading">
          <h2>📤 Books I Lent</h2>
        </div>

        {loans.length === 0 ? (
          <div className="empty-state">
            <p>You haven't lent any books yet.</p>
          </div>
        ) : (
          <div className="loan-list">
            {loans.map((loan) => (
              <div
                className="loan-row"
                key={loan.id}
              >
                <div className="loan-info">
                  <strong>
                    Book #{loan.book_id}
                  </strong>

                  <p>
                    Lent on{" "}
                    {loan.lent_at
                      ? new Date(
                          loan.lent_at
                        ).toLocaleString()
                      : "—"}
                  </p>

                  {loan.returned_at ? (
                    <span className="status-badge status-finished">
                      Returned
                    </span>
                  ) : (
                    <span className="status-badge status-reading">
                      Currently Lent
                    </span>
                  )}
                </div>

                {!loan.returned_at && (
                  <button
                    type="button"
                    className="primary-small-btn"
                    disabled={
                      returningId === loan.id
                    }
                    onClick={() =>
                      handleReturn(loan.id)
                    }
                  >
                    {returningId === loan.id
                      ? "Returning..."
                      : "Mark Returned"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Books I Borrowed */}

      <div className="dashboard-card">
        <div className="card-heading">
          <h2>📥 Books Borrowed</h2>
        </div>

        {borrowedBooks.length === 0 ? (
          <div className="empty-state">
            <p>You haven't borrowed any books.</p>
          </div>
        ) : (
          <div className="loan-list">
            {borrowedBooks.map((book) => (
              <div
                className="loan-row"
                key={book.loan_id}
              >
                <div className="loan-info">
                  <strong>{book.title}</strong>

                  <p>
                    by {book.author}
                  </p>

                  <p>
                    Borrowed on{" "}
                    {book.lent_at
                      ? new Date(
                          book.lent_at
                        ).toLocaleString()
                      : "—"}
                  </p>
{book.returned_at ? (
  <span className="status-badge status-finished">
    Returned
  </span>
) : (
  <>
    <span className="status-badge status-reading">
      Currently Borrowed
    </span>

    <button
      type="button"
      className="primary-small-btn"
      disabled={returningId === book.loan_id}
      onClick={() => handleReturn(book.loan_id)}
    >
      {returningId === book.loan_id
        ? "Returning..."
        : "Return Book"}
    </button>
  </>
)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Lending;