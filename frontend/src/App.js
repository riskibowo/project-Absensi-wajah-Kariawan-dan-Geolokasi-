import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FaceRegistration from "./pages/FaceRegistration";
import History from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";
import OfficeSettings from "./pages/OfficeSettings";
import { Toaster } from "@/components/ui/sonner"; // <--- TAMBAHKAN INI

function App() {
  // ... (sisa state Anda tetap sama)
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // ... (sisa useEffect Anda tetap sama)
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <div className="App">
      <Toaster /> {/* <--- TAMBAHKAN INI */}
      <BrowserRouter>
        <Routes>
          {/* ... (sisa Route Anda tetap sama) ... */}
          <Route
            path="/login"
            element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={token ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/face-registration"
            element={token ? <FaceRegistration user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/history"
            element={token ? <History user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        _ />
          <Route
            path="/admin"
            element={token && user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/office-settings"
            element={token && user?.role === 'admin' ? <OfficeSettings user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;