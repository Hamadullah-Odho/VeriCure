import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProtectedLayout, HeadAdminOnly } from './components/Layout';
import { ToastProvider } from './components/Toast';
import PageTransition from './components/PageTransition';
import SplashScreen from './components/SplashScreen';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Bootstrap from './pages/Bootstrap';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import GenerateReport from './pages/GenerateReport';
import ReportedMedicines from './pages/ReportedMedicines';
import PendingApprovals from './pages/PendingApprovals';
import AdminManagement from './pages/AdminManagement';

const SPLASH_MIN_MS = 550;
const SPLASH_FADE_MS = 350;

export default function App() {
  // Brief, one-time boot screen.
  // It never blocks longer than a fraction of a second
  // and does not touch auth/session state.
  const [booting, setBooting] = useState(true);
  const [splashFadingOut, setSplashFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFadingOut(true);
    }, SPLASH_MIN_MS);

    const removeTimer = setTimeout(() => {
      setBooting(false);
    }, SPLASH_MIN_MS + SPLASH_FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* =========================
                PUBLIC AUTH ROUTES
               ========================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/signup"
              element={<Signup />}
            />

            <Route
              path="/setup"
              element={<Bootstrap />}
            />

            {/* Forgot Password */}
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            {/* =========================
                PROTECTED ADMIN ROUTES
               ========================= */}

            <Route element={<ProtectedLayout />}>

              <Route element={<PageTransition />}>

                <Route
                  path="/dashboard"
                  element={<Dashboard />}
                />

                <Route
                  path="/detections"
                  element={<Detections />}
                />

                <Route
                  path="/reports"
                  element={<GenerateReport />}
                />

                <Route
                  path="/reported-medicines"
                  element={<ReportedMedicines />}
                />

                {/* Head Admin Only */}
                <Route
                  path="/pending-approvals"
                  element={
                    <HeadAdminOnly>
                      <PendingApprovals />
                    </HeadAdminOnly>
                  }
                />

                {/* Head Admin Only */}
                <Route
                  path="/admin-management"
                  element={
                    <HeadAdminOnly>
                      <AdminManagement />
                    </HeadAdminOnly>
                  }
                />

              </Route>

            </Route>

            {/* =========================
                FALLBACK ROUTE
               ========================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>
        </BrowserRouter>
      </AuthProvider>

      {/* Splash Screen */}
      {booting && (
        <SplashScreen
          fadingOut={splashFadingOut}
        />
      )}

    </ToastProvider>
  );
}