import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';
import { initials } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const TABS = ['All', 'People', 'Posts', 'Tags'];

function FollowIconButton({ user, onToggle }) {
  return (
    <button
      className={`follow-icon-btn ${user.followedByMe ? 'following' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(user);
      }}
      aria-label={user.followedByMe ? 'Unfollow' : 'Follow'}
    >
      {user.followedByMe ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="m5 13 4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [users, setUsers] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAllPeople, setShowAllPeople] = useState(false);
  const { user: me } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getTrending().then((data) => setTrending(data.hashtags)).catch(() => setTrending([]));
    api.searchUsers('').then((data) => setSuggested(data.users)).catch(() => setSuggested([]));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUsers([]);
      setPosts([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      Promise.all([
        api.searchUsers(q),
        q.startsWith('#') ? api.getFeed({ hashtag: q.slice(1) }) : api.getFeed({ q }),
      ])
        .then(([userData, postData]) => {
          setUsers(userData.users);
          setPosts(postData.posts);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleFollow(u) {
    if (!me) {
      navigate('/login');
      return;
    }
    const { user: updated } = await api.toggleFollow(u.id);
    const patch = (list) => list.map((x) => (x.id === updated.id ? updated : x));
    setUsers(patch);
    setSuggested(patch);
  }

  const showPeople = tab === 'All' || tab === 'People';
  const showPosts = tab === 'All' || tab === 'Posts';
  const showTags = tab === 'All' || tab === 'Tags';
  const isSearching = query.trim().length > 0;
  const visibleSuggested = showAllPeople ? suggested : suggested.slice(0, 3);

  return (
    <div className="app-shell">
      <div className="search-header">
        <div className="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search by user ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-tabs">
          {TABS.map((t) => (
            <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="search-body">
        {isSearching ? (
          <>
            {loading && <div className="page-loader">Searching…</div>}

            {!loading && showPeople && users.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">
                  People <span className="count">{users.length} results</span>
                </div>
                {users.map((u) => (
                  <div key={u.id} className="person-row" onClick={() => navigate(`/profile/${u.username}`)}>
                    <div className="avatar sm" style={{ background: u.avatarColor }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="avatar-img" /> : initials(u.fullName)}
                    </div>
                    <div className="who">
                      <span className="name">{u.fullName}</span>
                      <span className="meta">@{u.username}{u.bio ? ` · ${u.bio}` : ''}</span>
                    </div>
                    <FollowIconButton user={u} onToggle={handleFollow} />
                  </div>
                ))}
              </div>
            )}

            {!loading && showPosts && posts.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">Posts</div>
                {posts.map((p) => (
                  <div key={p.id} className="mini-post-row" onClick={() => navigate(`/post/${p.id}`)}>
                    <div className="avatar sm" style={{ background: p.author.avatarColor }}>
                      {initials(p.author.fullName)}
                    </div>
                    <div className="who">
                      <span className="name">{p.author.fullName}</span>
                      <p className="mini-post-content">{p.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && showTags && (
              <div className="search-section">
                <div className="search-section-title">Tags</div>
                {trending
                  .filter((h) => h.tag.includes(query.replace('#', '').toLowerCase()))
                  .map((h) => (
                    <div key={h.tag} className="tag-row" onClick={() => setQuery(`#${h.tag}`)}>
                      <span className="tag-name">#{h.tag}</span>
                      <span className="tag-count">{h.count} posts</span>
                    </div>
                  ))}
              </div>
            )}

            {!loading && users.length === 0 && posts.length === 0 && (
              <div className="empty-state">No results for "{query}"</div>
            )}
          </>
        ) : (
          <>
            {suggested.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">
                  People
                  {suggested.length > 3 && (
                    <button className="view-all-link" onClick={() => setShowAllPeople((v) => !v)}>
                      {showAllPeople ? 'Show less' : 'View all'}
                    </button>
                  )}
                </div>
                {visibleSuggested.map((u) => (
                  <div key={u.id} className="person-row" onClick={() => navigate(`/profile/${u.username}`)}>
                    <div className="avatar sm" style={{ background: u.avatarColor }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="avatar-img" /> : initials(u.fullName)}
                    </div>
                    <div className="who">
                      <span className="name">{u.fullName}</span>
                      <span className="meta">@{u.username}{u.bio ? ` · ${u.bio}` : ''}</span>
                    </div>
                    <FollowIconButton user={u} onToggle={handleFollow} />
                  </div>
                ))}
              </div>
            )}

            <div className="search-section">
              <div className="search-section-title">Trending</div>
              {trending.length === 0 && <div className="empty-state">No trending hashtags yet.</div>}
              {trending.map((h) => (
                <div key={h.tag} className="tag-row" onClick={() => setQuery(`#${h.tag}`)}>
                  <span className="tag-name">#{h.tag}</span>
                  <span className="tag-count">{h.count} posts</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
