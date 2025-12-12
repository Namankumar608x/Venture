import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./components/login";
import Signup from "./components/signup";
import Home from "./components/home";
import EventsDashboard from "./components/event"; 
import EventPage from "./components/eventpage";
import Schedule from "./components/schedule";
import Layout from "./components/Layout";

// ---------- PROTECTED ROUTE ----------
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Login />;
  }
  return children;
}

export default function App() {
  return (
    <>
      <Routes>

        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Inbox visible here via Layout) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:clubid"
          element={
            <ProtectedRoute>
              <Layout>
                <EventsDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:clubid/:eventId"
          element={
            <ProtectedRoute>
              <Layout>
                <EventPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:clubid/:eventId/:scheduleid"
          element={
            <ProtectedRoute>
              <Layout>
                <Schedule />
              </Layout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  );
}
