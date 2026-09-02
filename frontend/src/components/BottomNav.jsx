import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} />
      <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MessagesIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? 'currentColor' : 'none'}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" fill={active ? 'currentColor' : 'none'} />
      <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    function refresh() {
      api
        .getUnreadMessageCount()
        .then((data) => setUnread(data.count))
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [path, user]);

  if (!user) return null;

  const isHome = path === '/';
  const isSearch = path === '/search';
  const isMessages = path.startsWith('/messages');
  const isProfile = path.startsWith('/profile');

  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${isHome ? 'active' : ''}`} onClick={() => navigate('/')}>
        <HomeIcon active={isHome} />
        Home
      </button>
      <button className={`nav-item ${isSearch ? 'active' : ''}`} onClick={() => navigate('/search')}>
        <SearchIcon active={isSearch} />
        Search
      </button>
      <button className="nav-item fab" onClick={() => navigate('/compose')} aria-label="Create post">
        <PlusIcon />
      </button>
      <button className={`nav-item ${isMessages ? 'active' : ''}`} onClick={() => navigate('/messages')}>
        <span className="nav-icon-wrap">
          <MessagesIcon active={isMessages} />
          {unread > 0 && <span className="nav-badge" />}
        </span>
        Messages
      </button>
      <button
        className={`nav-item ${isProfile ? 'active' : ''}`}
        onClick={() => navigate(`/profile/${user?.username}`)}
      >
        <UserIcon active={isProfile} />
        Profile
      </button>
    </nav>
  );
}
