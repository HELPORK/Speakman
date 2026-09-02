import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ConfirmModal from './ConfirmModal';
import { initials, timeAgo } from './PostCard';

export default function CommentItem({ comment, onChange, onDelete, onReply, depth = 0 }) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  function goToProfile(e) {
    e.stopPropagation();
    navigate(`/profile/${comment.author.username}`);
  }

  async function handleLike() {
    const res = await api.toggleCommentLike(comment.id);
    onChange({ ...comment, likeCount: res.likeCount, likedByMe: res.likedByMe });
  }

  async function handleDelete() {
    await api.deleteComment(comment.id);
    setConfirmOpen(false);
    onDelete(comment.id);
  }

  async function handleSendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setReplying(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`comment-item ${depth > 0 ? 'is-reply' : ''}`}>
      <div className="avatar sm" style={{ background: comment.author.avatarColor, cursor: 'pointer' }} onClick={goToProfile}>
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} alt="" className="avatar-img" />
        ) : (
          initials(comment.author.fullName)
        )}
      </div>
      <div className="comment-body">
        <div>
          <span className="comment-name" style={{ cursor: 'pointer' }} onClick={goToProfile}>{comment.author.fullName}</span>
          <span className="comment-handle">
            @{comment.author.username} · {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="comment-text">{comment.content}</p>
        <div className="comment-actions">
          <button className={comment.likedByMe ? 'liked' : ''} onClick={handleLike}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={comment.likedByMe ? 'currentColor' : 'none'}>
              <path
                d="M12 20s-7-4.35-9.5-8.8C.7 7.7 2.2 4.5 5.4 4.1c1.9-.24 3.4.7 4.6 2.2 1.2-1.5 2.7-2.44 4.6-2.2 3.2.4 4.7 3.6 2.9 7.1C19 15.65 12 20 12 20Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            {comment.likeCount}
          </button>
          {depth === 0 && (
            <button onClick={() => setReplying((v) => !v)}>Reply</button>
          )}
          {comment.canDelete && (
            <button className="comment-delete" onClick={() => setConfirmOpen(true)}>
              Delete
            </button>
          )}
        </div>

        {replying && (
          <div className="reply-composer">
            <input
              autoFocus
              placeholder={`Reply to ${comment.author.fullName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
            />
            <button className="btn-primary sm" onClick={handleSendReply} disabled={sending || !replyText.trim()}>
              Send
            </button>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="reply-list">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                onChange={onChange}
                onDelete={onDelete}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Comment?"
        message="This action cannot be undone. Are you sure you want to delete this comment?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
