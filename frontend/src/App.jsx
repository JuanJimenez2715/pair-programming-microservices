import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Session from './pages/Session';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { useAuth } from './hooks/useAuth';

// Helper component for the root path
const IndexRedirect = () => {
  const { user, loading, getDashboardPath } = useAuth();
  if (loading) return <div className="loader">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<IndexRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route 
                path="/student/dashboard" 
                element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/teacher/dashboard" 
                element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} 
              />
              
              <Route path="/session/:id" element={<ProtectedRoute><Session /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><AnalyticsDashboard /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;