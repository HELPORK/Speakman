import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ConfirmModal from './ConfirmModal';
import ShareSheet from './ShareSheet';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '../context/AuthContext';

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function PostCard({ post, onChange, onDelete, showFollow = true }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [starPop, setStarPop] = useState(0);
  const [following, setFollowing] = useState(post.author.followedByMe || false);

  function requireAuth() {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  }

  async function handleStar(e) {
    e.stopPropagation();
    if (!requireAuth()) return;
    const { post: updated } = await api.toggleStar(post.id);
    onChange(updated);
    if (updated.starredByMe) {
      setStarPop((n) => n + 1);
    }
  }

  async function handleRepost(e) {
    e.stopPropagation();
    if (!requireAuth()) return;
    const { post: updated } = await api.toggleRepost(post.id);
    onChange(updated);
  }

  async function handleFollow(e) {
    e.stopPropagation();
    if (!requireAuth()) return;
    const { user: updated } = await api.toggleFollow(post.author.id);
    setFollowing(updated.followedByMe);
  }

  function openMenu(e) {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  async function handleDelete() {
    await api.deletePost(post.id);
    setConfirmOpen(false);
    onDelete?.(post.id);
  }

  return (
    <article className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
      <div className="post-head">
        <div
          className="avatar sm"
          style={{ background: post.author.avatarColor }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${post.author.username}`);
          }}
        >
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="" className="avatar-img" />
          ) : (
            initials(post.author.fullName)
          )}
        </div>
        <div className="who" onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${post.author.username}`);
        }}>
          <span className="name">{post.author.fullName}</span>
          <span className="meta">
            @{post.author.username} · {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.mine && (
          <div className="post-menu-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="post-menu-btn" onClick={openMenu} aria-label="Post options">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1.6" fill="currentColor" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                <circle cx="12" cy="19" r="1.6" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <div className="post-menu-dropdown">
                <button
                  className="danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {post.content && <p className="post-content">{post.content}</p>}
      {post.media?.url && post.media.type === 'image' && (
        <div className="post-image-wrap">
          <img src={post.media.url} alt="" className="post-image" />
        </div>
      )}
      {post.media?.url && post.media.type === 'video' && (
        <VideoPlayer src={post.media.url} className="post-video" />
      )}
      <div className="post-actions">
        <span className="star-btn-wrap">
          <button
            className={`star-btn ${post.starredByMe ? 'starred' : ''} ${starPop ? 'pop' : ''}`}
            onClick={handleStar}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.starredByMe ? 'currentColor' : 'none'}>
              <path
                d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {post.starCount}
          </button>
          {starPop > 0 && (
            <span className="sparkle-burst" key={starPop}>
              {Array.from({ length: 6 }).map((_, i) => (
                <i key={i} style={{ '--i': i }} />
              ))}
            </span>
          )}
        </span>
        <button onClick={(e) => e.stopPropagation() || navigate(`/post/${post.id}`)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5h16v11H8l-4 4V5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          {post.commentCount}
        </button>
        <button className={post.repostedByMe ? 'active' : ''} onClick={handleRepost}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M6 7v6h10M18 17v-6H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {post.repostCount}
        </button>
        {showFollow && !post.mine && !following ? (
          <button className="follow-text-link" onClick={handleFollow}>
            Follow
          </button>
        ) : (
          <button
            className="share-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShareOpen(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="6" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="19" r="2.3" stroke="currentColor" strokeWidth="1.6" />
              <path d="m8.1 10.8 7.5-4.4M8.1 13.2l7.5 4.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Post?"
        message="This action cannot be undone. Are you sure you want to delete this post?"
        confirmLabel="Delete"
        onConfirm={(e) => {
          e?.stopPropagation?.();
          handleDelete();
        }}
        onCancel={(e) => {
          e?.stopPropagation?.();
          setConfirmOpen(false);
        }}
      />

      <ShareSheet
        open={shareOpen}
        postId={post.id}
        postSnippet={post.content}
        onClose={() => setShareOpen(false)}
      />
    </article>
  );
}

export { initials, timeAgo };
