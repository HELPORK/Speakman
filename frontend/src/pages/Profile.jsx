import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import FollowListModal from '../components/FollowListModal';
import { useAuth } from '../context/AuthContext';
import { initials } from '../components/PostCard';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [starred, setStarred] = useState(null);
  const [reposts, setReposts] = useState(null);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(null); // 'followers' | 'following' | null
  const avatarInputRef = useRef(null);

  const isMine = me?.username === username;

  function load() {
    setProfile(null);
    api.getProfile(username).then((data) => {
      setProfile(data.user);
      setPosts(data.posts);
      setEditName(data.user.fullName);
      setEditBio(data.user.bio || '');
    });
  }

  useEffect(() => {
    load();
    setTab('posts');
    setStarred(null);
    setReposts(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  function loadStarred() {
    if (starred !== null) return;
    api.getStarredPosts(username).then((data) => setStarred(data.posts));
  }

  function loadReposts() {
    if (reposts !== null) return;
    api.getReposts(username).then((data) => setReposts(data.posts));
  }

  function updatePost(updated) {
    const patch = (list) => list?.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)) ?? list;
    setPosts((prev) => patch(prev));
    setStarred((prev) => patch(prev));
    setReposts((prev) => patch(prev));
  }

  function removePost(id) {
    const drop = (list) => list?.filter((p) => p.id !== id) ?? list;
    setPosts((prev) => drop(prev));
    setStarred((prev) => drop(prev));
    setReposts((prev) => drop(prev));
  }

  async function handleFollow() {
    if (!me) {
      navigate('/login');
      return;
    }
    const { user: updated } = await api.toggleFollow(profile.id);
    setProfile(updated);
  }

  function handlePickAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { user: updated } = await api.updateProfile({
        fullName: editName,
        bio: editBio,
        avatarFile,
      });
      setProfile(updated);
      updateUser(updated);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="app-shell">
        <div className="page-loader">Loading profile…</div>
      </div>
    );
  }

  const activeList = tab === 'posts' ? posts : tab === 'starred' ? starred : reposts;
  const displayAvatar = avatarPreview || profile.avatarUrl;

  return (
    <div className="app-shell">
      <div className="top-bar">
        <h1>Profile</h1>
        {isMine ? (
          <button className="mark-read-link" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Close' : 'Edit Profile'}
          </button>
        ) : (
          <span style={{ width: 60 }} />
        )}
      </div>

      <div className="profile-header">
        <div className="avatar-upload-wrap">
          <div className="avatar xl" style={{ background: profile.avatarColor }}>
            {displayAvatar ? <img src={displayAvatar} alt="" className="avatar-img" /> : initials(profile.fullName)}
          </div>
          {editing && isMine && (
            <button className="avatar-edit-btn" onClick={() => avatarInputRef.current?.click()} aria-label="Change photo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handlePickAvatar} />
        </div>
        <h2 className="profile-name">{profile.fullName}</h2>
        <span className="profile-handle">@{profile.username}</span>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-stats">
          <div>
            <strong>{posts.length}</strong>
            <span>Posts</span>
          </div>
          <div className="stat-clickable" onClick={() => setFollowListOpen('followers')}>
            <strong>{profile.followerCount}</strong>
            <span>Followers</span>
          </div>
          <div className="stat-clickable" onClick={() => setFollowListOpen('following')}>
            <strong>{profile.followingCount}</strong>
            <span>Following</span>
          </div>
        </div>

        {!isMine && (
          <button
            className={`follow-btn wide ${profile.followedByMe ? 'following' : ''}`}
            onClick={handleFollow}
          >
            {profile.followedByMe ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {editing && isMine && (
        <div className="edit-profile-panel">
          <div className="field">
            <label>Full Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="field">
            <label>Bio</label>
            <input
              value={editBio}
              maxLength={160}
              placeholder="Tell people about yourself"
              onChange={(e) => setEditBio(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      <div className="profile-tabs">
        <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
          My Posts
        </button>
        <button
          className={tab === 'starred' ? 'active' : ''}
          onClick={() => {
            setTab('starred');
            loadStarred();
          }}
        >
          Starred
        </button>
        <button
          className={tab === 'reposts' ? 'active' : ''}
          onClick={() => {
            setTab('reposts');
            loadReposts();
          }}
        >
          Reposts
        </button>
      </div>

      <div className="feed-list">
        {activeList === null && <div className="page-loader">Loading…</div>}
        {activeList && activeList.length === 0 && (
          <div className="empty-state">
            {tab === 'posts' && 'No posts yet.'}
            {tab === 'starred' && 'No starred posts yet.'}
            {tab === 'reposts' && 'No reposts yet.'}
          </div>
        )}
        {activeList?.map((post) => (
          <PostCard key={post.id} post={post} onChange={updatePost} onDelete={removePost} />
        ))}
      </div>

      <BottomNav />

      <FollowListModal
        open={!!followListOpen}
        username={username}
        mode={followListOpen}
        onClose={() => setFollowListOpen(null)}
      />
    </div>
  );
}
