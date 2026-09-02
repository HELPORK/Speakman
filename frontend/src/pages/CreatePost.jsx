import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import EmojiPicker from '../components/EmojiPicker';

export default function CreatePost() {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  function handlePickFile(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
  }

  function clearMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  }

  function insertEmoji(emoji) {
    setText((t) => t + emoji);
  }

  function insertHashtag() {
    setText((t) => (t.endsWith(' ') || t.length === 0 ? `${t}#` : `${t} #`));
    textareaRef.current?.focus();
  }

  async function handlePost() {
    if (!text.trim() && !mediaFile) return;
    setPosting(true);
    setError('');
    try {
      await api.createPost(text, mediaFile);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <button className="cancel-link" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <h1>Create Post</h1>
        <button className="post-btn" onClick={handlePost} disabled={posting || (!text.trim() && !mediaFile)}>
          Post
        </button>
      </div>

      {error && <div className="banner-error" style={{ margin: '10px 16px 0' }}>{error}</div>}

      <div className="composer-page">
        <div className="composer-textarea-wrap">
          <textarea
            ref={textareaRef}
            autoFocus
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="button"
            className="composer-emoji-inline-btn"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Add emoji"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M8.5 14.5a4 4 0 0 0 7 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {emojiOpen && (
            <div className="emoji-popover-anchor">
              <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
            </div>
          )}
        </div>

        {mediaPreview && mediaType === 'image' && (
          <div className="composer-image-preview large">
            <img src={mediaPreview} alt="" />
            <button type="button" className="remove-image-btn" onClick={clearMedia} aria-label="Remove image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {mediaPreview && mediaType === 'video' && (
          <div className="composer-image-preview large">
            <video src={mediaPreview} controls />
            <button type="button" className="remove-image-btn" onClick={clearMedia} aria-label="Remove video">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        <div className="add-to-post-label">Add to your post</div>
        <div className="media-toolbar">
          <button
            type="button"
            className="media-toolbar-btn"
            aria-label="Add image"
            onClick={() => imageInputRef.current?.click()}
            disabled={mediaType === 'video'}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m5 17 5-5 4 4 3-3 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => handlePickFile(e, 'image')} />

          <button
            type="button"
            className="media-toolbar-btn"
            aria-label="Add video"
            onClick={() => videoInputRef.current?.click()}
            disabled={mediaType === 'image'}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="m16 10 5-3v10l-5-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={(e) => handlePickFile(e, 'video')} />

          <button type="button" className="media-toolbar-btn" aria-label="Add hashtag" onClick={insertHashtag}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
