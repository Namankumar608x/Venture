import { Routes, Route } from "react-router-dom";

import Login from "./components/login.jsx";
import Signup from "./components/Signup";
import Home from "./components/Home";
import EventsDashboard from "./components/event"; 
import EventPage from "./components/eventpage";
import Schedule from "./components/schedule";
import Layout from "./components/Layout";
import ClubChat from "./components/ClubChat";
import TeamManage from "./components/teammanage";
import Loginclub from "./components/loginclub.jsx";
import Signupclub from "./components/signupclub.jsx";
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
          path="/events/:clubid/signup"
          element={
            <>
              {console.log("Route: /signup")}
              <Signupclub />
            </>
          }
        />
        <Route
          path="/"
          element={
            <>
              {console.log("Route: /login")}
              <Login />
            </>
          }
        />
        <Route
          path="/events/:clubid/login"
          element={
            <>
              {console.log("Route: /login")}
              <Loginclub />
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
          path="/events/:clubid/:eventId/team/:teamid"
          element={
            <ProtectedRoute>
              <>
                {console.log("Route: /events/:clubid/:eventId/team/:teamid")}
                <Layout>
                  <TeamManage />
                </Layout>
              </>
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
    </>
  );
}

