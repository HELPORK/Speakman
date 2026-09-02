import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import MessageThread from './pages/MessageThread';

// Requires login — used for actions that only make sense for a signed-in user
// (posting, notifications, direct messages).
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-shell">
        <div className="page-loader">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <Signup />
          </PublicOnly>
        }
      />

      {/* Guest-browsable: viewing works without an account, interacting prompts login */}
      <Route path="/" element={<Feed />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/search" element={<Search />} />
      <Route path="/profile/:username" element={<Profile />} />

      {/* Requires an account */}
      <Route
        path="/compose"
        element={
          <Protected>
            <CreatePost />
          </Protected>
        }
      />
      <Route
        path="/notifications"
        element={
          <Protected>
            <Notifications />
          </Protected>
        }
      />
      <Route
        path="/messages"
        element={
          <Protected>
            <Messages />
          </Protected>
        }
      />
      <Route
        path="/messages/:username"
        element={
          <Protected>
            <MessageThread />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
