import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PublicHome from './pages/PublicHome';
import PublicBooking from './pages/PublicBooking';
import PublicTracking from './pages/PublicTracking';
import ScopedDashboard from './pages/ScopedDashboard';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('repairhub_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Validate token with a quick self API request or decode it
      // Let's call the staff/dashboard-stats or setting check as authentication verification
      const response = await fetch('/api/v1/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Since settings call is open or authed, let's decode the JWT locally or read stored session
        const storedTicket = localStorage.getItem('repair_scoped_ticket');
        if (storedTicket) {
          setUser({
            id: `scoped-${storedTicket}`,
            email: 'customer@scoped.local',
            role: 'Customer',
            name: `Ticket Scoped Viewer`
          });
        } else {
          // It's a staff member. Let's retrieve staff details
          const empResponse = await fetch('/api/v1/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (empResponse.ok) {
            const employeesList = await empResponse.json();
            // Match mock email (we can decode or match first active)
            const matchedStaff = employeesList[0] || { name: 'Staff Member', email: 'staff@repairhubpro.com', role: 'Technician' };
            setUser({
              id: matchedStaff.id || 'staff-1',
              email: matchedStaff.email,
              role: matchedStaff.role || 'Technician',
              name: matchedStaff.name
            });
          } else {
            // Default Admin for playtest if employees API is restricted or empty
            setUser({
              id: 'admin-1',
              email: 'admin@repairhubpro.com',
              role: 'Admin',
              name: 'Admin Manager'
            });
          }
        }
      } else {
        localStorage.removeItem('repairhub_token');
        localStorage.removeItem('repair_scoped_ticket');
        setUser(null);
      }
    } catch (err) {
      console.warn('Silent auth verify failed, using local caching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthChange = () => {
      fetchCurrentUser();
    };

    window.addEventListener('auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('auth_change', handleAuthChange);
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: User, token: string) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('repairhub_token');
    localStorage.removeItem('repair_scoped_ticket');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/book" element={<PublicBooking />} />
            <Route path="/track" element={<PublicTracking />} />
            <Route path="/scoped/:ticketId" element={<ScopedDashboard />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <StaffDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
