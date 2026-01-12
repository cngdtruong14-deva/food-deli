import { Navigate } from "react-router-dom";


// ============================================================
// EMERGENCY BYPASS FOR DEBUGGING
// Set to true to disable authentication check during development.
// WARNING: Remember to set back to false before deploying!
const BYPASS_AUTH = false;
// ============================================================

/**
 * SimpleAuthGuard - A simple wrapper component for protected routes.
 * Checks if a token exists in localStorage.
 * - If token exists: Renders children (protected content)
 * - If no token: Redirects to login page
 */
const SimpleAuthGuard = ({ children }) => {
  // Emergency bypass for debugging UI without logging in
  if (BYPASS_AUTH) {
    console.warn("⚠️ AUTH BYPASS IS ENABLED - Disable before production!");
    return children;
  }

  // Check for token in localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    // No token found, redirect to dashboard (login is handled via dropdown)
    return <Navigate to="/dashboard" replace />;
  }

  // Token exists, render protected content
  return children;
};



export default SimpleAuthGuard;
