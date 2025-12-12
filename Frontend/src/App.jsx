import { Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import EventsDashboard from "./components/event"; 
import EventPage from "./components/eventpage";
import Schedule from "./components/schedule";
import Layout from "./components/Layout";
import ClubChat from "./components/ClubChat";
import EventQueries from "./components/EventQueries";
import AdminEventQueries from "./components/AdminEventQueries";

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
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
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

      <Route
        path="/club/:clubId/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <ClubChat key={window.location.pathname} clubId={window.location.pathname.split("/")[2]} />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/events/:clubid/:eventId/query"
        element={
          <ProtectedRoute>
            <Layout>
              <EventQueries />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/events/:clubid/:eventId/queries/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminEventQueries />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Login />} />
    </Routes>
  );
}
