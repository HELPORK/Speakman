import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';
import { initials, timeAgo } from '../components/PostCard';

const VERB = {
  star: 'starred your post',
  comment: 'commented on your post',
  follow: 'started following you',
  repost: 'reposted your post',
  mention: 'mentioned you in a comment',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(null);
  const navigate = useNavigate();

  function load() {
    api
      .getNotifications()
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkAllRead() {
    await api.markNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClick(n) {
    if (n.type === 'follow') navigate(`/profile/${n.actor.username}`);
    else if (n.post) navigate(`/post/${n.post.id}`);
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <h1>Notifications</h1>
        <button className="mark-read-link" onClick={handleMarkAllRead}>
          Mark all as read
        </button>
      </div>

      <div className="notif-list">
        {notifications === null && <div className="page-loader">Loading…</div>}
        {notifications !== null && notifications.length === 0 && (
          <div className="empty-state">You're all caught up — no notifications yet.</div>
        )}
        {notifications?.map((n) => (
          <div
            key={n.id}
            className={`notif-row ${!n.read ? 'unread' : ''}`}
            onClick={() => handleClick(n)}
          >
            <div
              className="avatar sm"
              style={{ background: n.actor.avatarColor, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${n.actor.username}`);
              }}
            >
              {n.actor.avatarUrl ? (
                <img src={n.actor.avatarUrl} alt="" className="avatar-img" />
              ) : (
                initials(n.actor.fullName)
              )}
            </div>
            <div className="notif-text">
              <span>
                <strong>{n.actor.fullName}</strong> {VERB[n.type] || 'interacted with you'}
              </span>
              {n.post && (
                <div className="notif-post-preview">
                  {n.post.media?.url && n.post.media.type === 'image' && (
                    <img src={n.post.media.url} alt="" className="notif-post-thumb" />
                  )}
                  {n.post.media?.url && n.post.media.type === 'video' && (
                    <video src={n.post.media.url} className="notif-post-thumb" muted />
                  )}
                  {n.post.content && <span className="notif-post-snippet">{n.post.content}</span>}
                </div>
              )}
            </div>
            <span className="notif-time">{timeAgo(n.createdAt)}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
