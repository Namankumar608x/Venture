import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import EventsDashboard from "./components/event"; 
import EventPage from "./components/eventpage";
import Schedule from "./components/schedule";
import Layout from "./components/Layout";
import ClubChat from "./components/ClubChat";

// ---------- PROTECTED ROUTE with debug ----------
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  console.log("DEBUG ProtectedRoute token:", token);

  if (!token) {
    console.warn("ProtectedRoute: No token, rendering Login");
    return <Login />;
  }

  console.log("ProtectedRoute: Token found, rendering children");
  return children;
}

export default function App() {
  console.log("DEBUG App.jsx render");

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/signup"
          element={
            <>
              {console.log("Route: /signup")}
              <Signup />
            </>
          }
        />

        <Route
          path="/login"
          element={
            <>
              {console.log("Route: /login")}
              <Login />
            </>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <>
                {console.log("Route: /home")}
                <Layout>
                  <Home />
                </Layout>
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:clubid"
          element={
            <ProtectedRoute>
              <>
                {console.log("Route: /events/:clubid")}
                <Layout>
                  <EventsDashboard />
                </Layout>
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:clubid/:eventId"
          element={
            <ProtectedRoute>
              <>
                {console.log("Route: /events/:clubid/:eventId")}
                <Layout>
                  <EventPage />
                </Layout>
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:clubid/:eventId/:scheduleid"
          element={
            <ProtectedRoute>
              <>
                {console.log(
                  "Route: /events/:clubid/:eventId/:scheduleid"
                )}
                <Layout>
                  <Schedule />
                </Layout>
              </>
            </ProtectedRoute>
          }
        />

        {/* Fixed ClubChat route */}
        <Route
          path="/club/:clubId/chat"
          element={
            <ProtectedRoute>
              <>
                {console.log("Route: /club/:clubId/chat")}
                <Layout>
                  <ClubChat
                    // Debug log for clubId from URL
                    key={window.location.pathname}
                    clubId={window.location.pathname.split("/")[2]}
                  />
                </Layout>
              </>
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route
          path="*"
          element={
            <>
              {console.warn("Route: No match! Redirecting to /login")}
              <Login />
            </>
          }
        />
      </Routes>
    </>
  );
}
