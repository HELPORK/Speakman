import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PostCard from '../components/PostCard';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { initials } from '../components/PostCard';

function Logo() {
  return (
    <div className="speakman-logo">
      <span className="speakman-logo-mark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Speakman
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getFeed()
      .then((data) => setPosts(data.posts))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .getUnreadCount()
      .then((data) => setUnreadNotifs(data.count))
      .catch(() => {});
  }, [user]);

  function updatePost(updated) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  function removePost(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleCompose() {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/compose');
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <Logo />
        {user ? (
          <div className="top-bar-icons">
            <button className="icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
              <span className="nav-icon-wrap">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                {unreadNotifs > 0 && <span className="nav-badge" />}
              </span>
            </button>
            <div
              className="avatar sm"
              style={{ background: user.avatarColor }}
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="avatar-img" />
              ) : (
                initials(user.fullName)
              )}
            </div>
          </div>
        ) : (
          <div className="guest-auth-buttons">
            <button className="btn-primary sm" onClick={() => navigate('/login')}>
              Log In
            </button>
            <button className="btn-outline sm" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        )}
      </div>

      <div className="discover-heading">
        <div>
          <h2>{user ? 'Home' : 'Discover conversations'}</h2>
          <p>{user ? 'What\'s new from people you follow.' : 'Ideas worth sharing, from everyone.'}</p>
        </div>
        <button className="edit-icon-btn" onClick={handleCompose} aria-label="Create post">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="m16.5 4.5 3 3L8 19l-4 1 1-4L16.5 4.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="feed-list">
        {posts === null && <div className="page-loader">Loading feed…</div>}
        {posts !== null && posts.length === 0 && (
          <div className="empty-state">No posts yet. Be the first to share something!</div>
        )}
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} onChange={updatePost} onDelete={removePost} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
