import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './components/Login';

const SupportTicketsApp = React.lazy(() => import('supportTickets/SupportTicketsApp'));

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes inside layout */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
          }
        >
          <Route
            path="support"
            element={
              <React.Suspense fallback={<div>Loading Support Tickets...</div>}>
                <SupportTicketsApp />
              </React.Suspense>
            }
          />
        </Route>

        {/* Catch-all fallback */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/support" : "/login"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
