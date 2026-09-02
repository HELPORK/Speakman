import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import CommentItem from '../components/CommentItem';
import ConfirmModal from '../components/ConfirmModal';
import ShareSheet from '../components/ShareSheet';
import EmojiPicker from '../components/EmojiPicker';
import VideoPlayer from '../components/VideoPlayer';
import { initials, timeAgo } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

function buildTree(flat) {
  const byId = new Map(flat.map((c) => [c.id, { ...c, replies: [] }]));
  const roots = [];
  byId.forEach((c) => {
    if (c.parentComment && byId.has(c.parentComment)) {
      byId.get(c.parentComment).replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [flatComments, setFlatComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [starPop, setStarPop] = useState(0);

  function load() {
    api.getPost(id).then((data) => {
      setPost(data.post);
      setFlatComments(data.comments);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function requireAuth() {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  }

  async function handleStar() {
    if (!requireAuth()) return;
    const { post: updated } = await api.toggleStar(post.id);
    setPost(updated);
    if (updated.starredByMe) {
      setStarPop((n) => n + 1);
    }
  }

  async function handleRepost() {
    if (!requireAuth()) return;
    const { post: updated } = await api.toggleRepost(post.id);
    setPost(updated);
  }

  async function handleDelete() {
    await api.deletePost(post.id);
    setConfirmOpen(false);
    navigate(-1);
  }

  async function handleSendComment() {
    if (!requireAuth()) return;
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const { comment } = await api.addComment(post.id, commentText);
      setFlatComments((prev) => [...prev, comment]);
      setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
      setCommentText('');
    } finally {
      setSending(false);
    }
  }

  async function handleReply(parentCommentId, text) {
    if (!requireAuth()) return;
    const { comment } = await api.addComment(post.id, text, parentCommentId);
    setFlatComments((prev) => [...prev, comment]);
    setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
  }

  function updateComment(updated) {
    setFlatComments((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }

  function removeComment(commentId) {
    setFlatComments((prev) => prev.filter((c) => c.id !== commentId && c.parentComment !== commentId));
    setPost((prev) => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
  }

  if (!post) {
    return (
      <div className="app-shell">
        <div className="page-loader">Loading post…</div>
      </div>
    );
  }

  const commentTree = buildTree(flatComments);

  return (
    <div className="app-shell">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>Post</h1>
        {post.mine ? (
          <div className="post-menu-wrap">
            <button className="post-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Post options">
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
        ) : (
          <span style={{ width: 20 }} />
        )}
      </div>

      <div className="detail-post">
        <div className="post-head">
          <div className="avatar" style={{ background: post.author.avatarColor }}>
            {post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="avatar-img" />
            ) : (
              initials(post.author.fullName)
            )}
          </div>
          <div className="who">
            <span className="name">{post.author.fullName}</span>
            <span className="meta">
              ID: {post.author.username} · {timeAgo(post.createdAt)}
            </span>
          </div>
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
        <div className="detail-stats">
          <span>{post.starCount} stars</span>
          <span>{post.commentCount} comments</span>
          <span>{post.repostCount} reposts</span>
        </div>
        <div className="post-actions" style={{ marginTop: 10 }}>
          <span className="star-btn-wrap">
            <button className={`star-btn ${post.starredByMe ? 'starred' : ''} ${starPop ? 'pop' : ''}`} onClick={handleStar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={post.starredByMe ? 'currentColor' : 'none'}>
                <path
                  d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              Star
            </button>
            {starPop > 0 && (
              <span className="sparkle-burst" key={starPop}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <i key={i} style={{ '--i': i }} />
                ))}
              </span>
            )}
          </span>
          <button>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            Comment
          </button>
          <button className={post.repostedByMe ? 'active' : ''} onClick={handleRepost}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M6 7v6h10M18 17v-6H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            Repost
          </button>
          <button onClick={() => setShareOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="6" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="19" r="2.3" stroke="currentColor" strokeWidth="1.6" />
              <path d="m8.1 10.8 7.5-4.4M8.1 13.2l7.5 4.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Share
          </button>
        </div>
      </div>

      <div className="comments-header">{post.commentCount} replies</div>
      <div className="feed-list" style={{ flexGrow: 0 }}>
        {commentTree.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            onChange={updateComment}
            onDelete={removeComment}
            onReply={handleReply}
          />
        ))}
      </div>

      <div className="comment-composer">
        {emojiOpen && (
          <EmojiPicker
            onSelect={(e) => setCommentText((t) => t + e)}
            onClose={() => setEmojiOpen(false)}
          />
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
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
        />
        <button className="comment-send" onClick={handleSendComment} disabled={sending || !commentText.trim()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M4 12h16M13 6l7 6-7 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Post?"
        message="This action cannot be undone. Are you sure you want to delete this post?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <ShareSheet
        open={shareOpen}
        postId={post.id}
        postSnippet={post.content}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
