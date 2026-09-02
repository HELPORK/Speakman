import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import EmojiPicker from '../components/EmojiPicker';
import { initials, timeAgo } from '../components/PostCard';

export default function MessageThread() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef(null);

  function load() {
    api
      .getThread(username)
      .then((data) => {
        setPartner(data.partner);
        setMessages(data.messages);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const { message } = await api.sendMessage(username, { text });
      setMessages((prev) => [...prev, message]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!partner) {
    return (
      <div className="app-shell">
        <div className="top-bar">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1>Messages</h1>
          <span style={{ width: 20 }} />
        </div>
        {error ? <div className="empty-state">{error}</div> : <div className="page-loader">Loading…</div>}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate('/messages')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="thread-header" onClick={() => navigate(`/profile/${partner.username}`)}>
          <div className="avatar sm" style={{ background: partner.avatarColor }}>
            {partner.avatarUrl ? (
              <img src={partner.avatarUrl} alt="" className="avatar-img" />
            ) : (
              initials(partner.fullName)
            )}
          </div>
          <div className="who">
            <span className="name">{partner.fullName}</span>
            <span className="meta">ID: {partner.username}</span>
          </div>
        </div>
        <span style={{ width: 20 }} />
      </div>

      <div className="message-thread">
        {messages.length === 0 && (
          <div className="empty-state">Say hello to @{partner.username}.</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`message-bubble ${m.mine ? 'mine' : ''}`}>
            {m.sharedPost && (
              <div
                className="shared-post-card"
                onClick={() => navigate(`/post/${m.sharedPost.id}`)}
              >
                {m.sharedPost.media?.url && m.sharedPost.media.type === 'image' && (
                  <img src={m.sharedPost.media.url} alt="" className="shared-post-thumb" />
                )}
                <div>
                  <span className="shared-post-author">@{m.sharedPost.author?.username}</span>
                  <p className="shared-post-content">{m.sharedPost.content}</p>
                </div>
              </div>
            )}
            {m.text && <p>{m.text}</p>}
            <span className="message-time">{timeAgo(m.createdAt)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div className="banner-error" style={{ margin: '0 20px 10px' }}>{error}</div>}

      <div className="comment-composer">
        {emojiOpen && (
          <EmojiPicker onSelect={(e) => setText((t) => t + e)} onClose={() => setEmojiOpen(false)} />
        )}
        <button type="button" className="emoji-toggle-btn" onClick={() => setEmojiOpen((v) => !v)} aria-label="Add emoji">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
            <path d="M8.5 14.5a4 4 0 0 0 7 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="comment-send" onClick={handleSend} disabled={sending || !text.trim()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M4 12h16M13 6l7 6-7 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
