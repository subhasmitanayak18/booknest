import { useState } from "react";
import api from "../api/client";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }

      if (password.length < 8) {
        setError(
          "Password must be at least 8 characters."
        );
        return;
      }
    }

    try {
      setLoading(true);

      if (isLogin) {
        const response = await api.post("/auth/login", {
          email: email.trim(),
          password,
        });

        localStorage.setItem(
          "access_token",
          response.data.access_token
        );

        localStorage.setItem(
          "refresh_token",
          response.data.refresh_token
        );

        setMessage("Login successful.");

        if (onLogin) {
          await onLogin();
        }
      } else {
        await api.post("/auth/signup", {
          name: name.trim(),
          email: email.trim(),
          password,
        });

        setMessage(
          "Account created successfully. Please log in."
        );

        setMode("login");
        setPassword("");
      }
    } catch (err) {
      console.error("Authentication error:", err);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setError(
          detail ||
            (isLogin
              ? "Unable to log in."
              : "Unable to create account.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) =>
      current === "login" ? "signup" : "login"
    );

    setError("");
    setMessage("");
    setPassword("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand">
            📚 <span>BookNest</span>
          </div>

          <h1>
            {isLogin
              ? "Welcome Back"
              : "Create Your Account"}
          </h1>

          <p className="subtitle">
            {isLogin
              ? "Sign in to manage your reading library."
              : "Start tracking your reading journey."}
          </p>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={
              isLogin ? "active" : ""
            }
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={
              !isLogin ? "active" : ""
            }
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name">
                Name
              </label>

              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">
              Email
            </label>

            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">
              Password
            </label>

            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder={
                isLogin
                  ? "Enter your password"
                  : "At least 8 characters"
              }
              disabled={loading}
            />

            {!isLogin && (
              <small>
                Password must contain at least 8
                characters.
              </small>
            )}
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating account..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {isLogin
              ? "Create one"
              : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;