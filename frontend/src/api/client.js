// In local dev, Vite proxies '/api' to http://localhost:5000 (see vite.config.js).
// In production, the frontend and backend are deployed separately with different
// domains, so we need the full backend URL — set VITE_API_URL as a build-time
// environment variable on your hosting platform, e.g:
//   VITE_API_URL=https://your-backend.onrender.com/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('speakman_token');
}

async function request(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  // Feed/posts — guest-browsable, token attached if present but not required
  getFeed: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/posts${qs ? `?${qs}` : ''}`);
  },
  getTrending: () => request('/posts/meta/trending'),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (content, mediaFile) => {
    const form = new FormData();
    form.append('content', content || '');
    if (mediaFile) form.append('media', mediaFile);
    return request('/posts', { method: 'POST', body: form, isForm: true });
  },
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  toggleStar: (id) => request(`/posts/${id}/star`, { method: 'POST' }),
  toggleRepost: (id) => request(`/posts/${id}/repost`, { method: 'POST' }),

  addComment: (postId, content, parentCommentId) =>
    request(`/comments/${postId}`, { method: 'POST', body: { content, parentCommentId } }),
  deleteComment: (commentId) => request(`/comments/${commentId}`, { method: 'DELETE' }),
  toggleCommentLike: (commentId) => request(`/comments/${commentId}/like`, { method: 'POST' }),

  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (username) => request(`/users/${username}`),
  getStarredPosts: (username) => request(`/users/${username}/starred`),
  getReposts: (username) => request(`/users/${username}/reposts`),
  updateProfile: ({ fullName, bio, avatarFile }) => {
    const form = new FormData();
    if (fullName !== undefined) form.append('fullName', fullName);
    if (bio !== undefined) form.append('bio', bio);
    if (avatarFile) form.append('avatar', avatarFile);
    return request('/users/me', { method: 'PUT', body: form, isForm: true });
  },
  toggleFollow: (userId) => request(`/users/${userId}/follow`, { method: 'POST' }),
  getFollowers: (username) => request(`/users/${username}/followers`),
  getFollowing: (username) => request(`/users/${username}/following`),

  getNotifications: () => request('/notifications'),
  markNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
  getUnreadCount: () => request('/notifications/unread-count'),

  getConversations: () => request('/messages/conversations'),
  getThread: (username) => request(`/messages/${username}`),
  sendMessage: (username, { text, sharedPostId }) =>
    request(`/messages/${username}`, { method: 'POST', body: { text, sharedPostId } }),
  getUnreadMessageCount: () => request('/messages/meta/unread-count'),
};
