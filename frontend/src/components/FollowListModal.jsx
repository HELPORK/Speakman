import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { initials } from './PostCard';

export default function FollowListModal({ open, username, mode, onClose }) {
  const [users, setUsers] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setUsers(null);
    const fetcher = mode === 'followers' ? api.getFollowers : api.getFollowing;
    fetcher(username)
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]));
  }, [open, username, mode]);

  if (!open) return null;

  async function handleFollow(u) {
    const { user: updated } = await api.toggleFollow(u.id);
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card follow-list-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{mode === 'followers' ? 'Followers' : 'Following'}</h3>

        <div className="follow-list-body">
          {users === null && <div className="page-loader">Loading…</div>}
          {users !== null && users.length === 0 && (
            <div className="empty-state" style={{ padding: '30px 10px' }}>
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          )}
          {users?.map((u) => (
            <div
              key={u.id}
              className="person-row"
              onClick={() => {
                onClose();
                navigate(`/profile/${u.username}`);
              }}
            >
              <div className="avatar sm" style={{ background: u.avatarColor }}>
                {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="avatar-img" /> : initials(u.fullName)}
              </div>
              <div className="who">
                <span className="name">{u.fullName}</span>
                <span className="meta">@{u.username}</span>
              </div>
              <button
                className={`follow-icon-btn ${u.followedByMe ? 'following' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow(u);
                }}
                aria-label={u.followedByMe ? 'Unfollow' : 'Follow'}
              >
                {u.followedByMe ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="m5 13 4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>

        <button className="btn-secondary" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
