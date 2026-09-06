function Navbar({
  user,
  activeSection,
  setActiveSection,
  onLogout,
}) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
    },
    {
      id: "books",
      label: "My Books",
    },
    {
      id: "shelves",
      label: "Shelves",
    },
    {
      id: "lending",
      label: "Lending",
    },
    {
      id: "activity",
      label: "Activity",
    },
  ];

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="brand">
          <span>BookNest</span>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activeSection === item.id
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="navbar-right">
        <span className="welcome">
          Welcome, <strong>{user?.name}</strong>
        </span>

        <button
          type="button"
          className="logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;