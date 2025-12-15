import { Routes, Route } from "react-router-dom";

import Login from "./components/login.jsx";
import Signup from "./components/Signup";
import Home from "./components/home.jsx";
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
import Edit from "./components/editevent.jsx";
import Profile from "./components/profile";
import EventBracket from "./components/EventBracket";
import EventMatches from "./components/EventMatches";
import MatchControl from "./components/MatchControl";
import EventWinner from "./components/EventWinner";
import LiveMatchView from "./components/LiveMatchView.jsx";


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!token && !refreshToken) {
    console.log("Redirecting to login");
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

  {/* PUBLIC */}
  <Route path="/" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/events/:clubid/login" element={<Loginclub />} />
  <Route path="/events/:clubid/signup" element={<Signupclub />} />
 <Route path="/profile" element={<Profile />} />
  {/* PROTECTED */}
  <Route path="/home" element={
    <ProtectedRoute>
      <Layout><Home /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid" element={
    <ProtectedRoute>
      <Layout><EventsDashboard /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid/:eventId" element={
    <ProtectedRoute>
      <Layout><EventPage /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid/:eventId/edit" element={
    <ProtectedRoute>
      <Layout><Edit /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid/:eventId/team/:teamid" element={
    <ProtectedRoute>
      <Layout><TeamManage /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid/:eventId/:scheduleid" element={
    <ProtectedRoute>
      <Layout><Schedule /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid/:eventId/query" element={
    <ProtectedRoute>
      <Layout><EventQueries /></Layout>
    </ProtectedRoute>
  } />

  <Route path="/events/:clubid/:eventId/queries/admin" element={
    <ProtectedRoute>
      <Layout><AdminEventQueries /></Layout>
    </ProtectedRoute>
  } />
  {/* EVENT – TOURNAMENT PAGES */}

<Route path="/events/:clubid/:eventId/bracket" element={
  <ProtectedRoute>
    <Layout><EventBracket /></Layout>
  </ProtectedRoute>
} />

<Route path="/events/:clubid/:eventId/matches" element={
  <ProtectedRoute>
    <Layout><EventMatches /></Layout>
  </ProtectedRoute>
} />



<Route path="/events/:clubid/:eventId/winner" element={
  <ProtectedRoute>
    <Layout><EventWinner /></Layout>
  </ProtectedRoute>
} />

<Route
  path="/events/:clubid/:eventId/matches/:matchId"
  element={
    <ProtectedRoute>
      <Layout>
        <MatchControl />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/events/:clubid/:eventId/matches/:matchId/live"
  element={
    <ProtectedRoute>
      <Layout>
        <LiveMatchView />
      </Layout>
    </ProtectedRoute>
  }
/>



  <Route path="*" element={<Login />} />
  
</Routes>

    </>
  );
}

