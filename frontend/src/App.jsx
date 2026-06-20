import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Submit from './pages/Submit';
import History from './pages/History';
import AdminAppeals from './pages/admin/AdminAppeals';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminPolicies from './pages/admin/AdminPolicies';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/submit" element={
            <ProtectedRoute><Submit /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><History /></ProtectedRoute>
          } />

          <Route path="/admin" element={<Navigate to="/admin/appeals" replace />} />
          <Route path="/admin/appeals" element={
            <ProtectedRoute adminOnly><AdminAppeals /></ProtectedRoute>
          } />
          <Route path="/admin/submissions" element={
            <ProtectedRoute adminOnly><AdminSubmissions /></ProtectedRoute>
          } />
          <Route path="/admin/policies" element={
            <ProtectedRoute adminOnly><AdminPolicies /></ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
