import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';
import { initials, timeAgo } from '../components/PostCard';

export default function Messages() {
  const [conversations, setConversations] = useState(null);
  const [newUserId, setNewUserId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    function refresh() {
      api
        .getConversations()
        .then((data) => setConversations(data.conversations))
        .catch(() => setConversations((prev) => prev ?? []));
    }
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleStartConversation(e) {
    e.preventDefault();
    const handle = newUserId.trim().replace(/^@/, '');
    if (!handle) return;
    setError('');
    navigate(`/messages/${handle}`);
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <h1>Messages</h1>
      </div>

      <form className="new-message-row" onSubmit={handleStartConversation}>
        <input
          placeholder="Message someone by their user ID"
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
        />
        <button className="btn-primary sm" type="submit" disabled={!newUserId.trim()}>
          Chat
        </button>
      </form>
      {error && <div className="banner-error" style={{ margin: '0 20px 10px' }}>{error}</div>}

      <div className="conversation-list">
        {conversations === null && <div className="page-loader">Loading…</div>}
        {conversations !== null && conversations.length === 0 && (
          <div className="empty-state">No conversations yet. Message someone by their user ID above.</div>
        )}
        {conversations?.map((c) => (
          <div key={c.user.id} className="conversation-row" onClick={() => navigate(`/messages/${c.user.username}`)}>
            <div className="avatar" style={{ background: c.user.avatarColor }}>
              {c.user.avatarUrl ? (
                <img src={c.user.avatarUrl} alt="" className="avatar-img" />
              ) : (
                initials(c.user.fullName)
              )}
            </div>
            <div className="who">
              <span className="name">{c.user.fullName}</span>
              <span className="meta">
                {c.lastMessage.mine ? 'You: ' : ''}
                {c.lastMessage.sharedPost ? 'Shared a post' : c.lastMessage.text}
              </span>
            </div>
            <div className="conversation-meta">
              <span className="notif-time">{timeAgo(c.lastMessage.createdAt)}</span>
              {c.unread > 0 && <span className="unread-pill">{c.unread}</span>}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
