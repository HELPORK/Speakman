import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { initials } from './PostCard';

export default function ShareSheet({ open, postId, postSnippet, onClose }) {
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [friends, setFriends] = useState(null);
  const [sentTo, setSentTo] = useState(null);
  const { user: me } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !me) return;
    setFriends(null);
    setSentTo(null);
    api
      .getConversations()
      .then((data) => setFriends(data.conversations.map((c) => c.user)))
      .catch(() => setFriends([]));
  }, [open, me]);

  if (!open) return null;

  const shareUrl = `${window.location.origin}/post/${postId}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus('Link copied!');
      setTimeout(() => setStatus(''), 1800);
    } catch {
      setStatus('Could not copy link');
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Speakman', text: postSnippet, url: shareUrl });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      handleCopyLink();
    }
  }

  async function sendTo(handle) {
    if (!handle) return;
    setSending(true);
    setStatus('');
    try {
      await api.sendMessage(handle, { sharedPostId: postId });
      setSentTo(handle);
      setStatus(`Sent to @${handle}`);
      setUsername('');
      setTimeout(() => {
        onClose();
        navigate(`/messages/${handle}`);
      }, 700);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleSendToUser() {
    sendTo(username.trim().replace(/^@/, ''));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card share-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Share Post</h3>

        <button className="share-option" onClick={handleCopyLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 12h6M10 6h6a3 3 0 0 1 0 6h-1M14 18H8a3 3 0 0 1 0-6h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copy link
        </button>

        <button className="share-option" onClick={handleNativeShare}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m8.3 10.7 7.4-4.4M8.3 13.3l7.4 4.4" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          Share via…
        </button>

        {me && friends?.length > 0 && (
          <>
            <div className="share-divider">send to a friend</div>
            <div className="share-friend-list">
              {friends.map((f) => (
                <button
                  key={f.id}
                  className="share-friend-row"
                  disabled={sending}
                  onClick={() => sendTo(f.username)}
                >
                  <div className="avatar sm" style={{ background: f.avatarColor }}>
                    {f.avatarUrl ? <img src={f.avatarUrl} alt="" className="avatar-img" /> : initials(f.fullName)}
                  </div>
                  <span className="share-friend-name">{f.fullName}</span>
                  {sentTo === f.username ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="m5 13 4 4 10-10" stroke="var(--brand-dark)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className="share-friend-send">Send</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="share-divider">or send to a user ID</div>

        <div className="share-send-row">
          <input
            placeholder="Enter user ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendToUser()}
          />
          <button className="btn-primary" onClick={handleSendToUser} disabled={sending || !username.trim()}>
            Send
          </button>
        </div>

        {status && <p className="share-status">{status}</p>}

        <button className="btn-secondary" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
