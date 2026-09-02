# Speakman

A full-stack social media app — React (Vite) frontend, Node/Express backend, MongoDB database.

Screens implemented: Log In, Sign Up, Home Feed (with inline composer), Create Post, and Post Detail (with comments, likes, and reposts).

## Project structure

```
speakman/
  backend/    Express API + Mongoose models (User, Post, Comment) + JWT auth
  frontend/   React app (Vite) — Login, Signup, Feed, Create Post, Post Detail
```

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGODB_URI and a strong JWT_SECRET
npm run dev        # starts on http://localhost:5000 (nodemon)
# or: npm start
```

`.env` variables:

| Variable      | Description                                   |
|---------------|------------------------------------------------|
| MONGODB_URI   | Mongo connection string, e.g. `mongodb://127.0.0.1:27017/speakman` |
| JWT_SECRET    | Any long random string used to sign auth tokens |
| PORT          | API port (default 5000)                        |

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:5000`, so just run both servers side by side and open http://localhost:5173.

## New in this version
- **Image uploads**: attach an image to any post (from the feed composer or the full-screen Create Post screen). Images are stored on disk in `backend/uploads/` and served at `/uploads/<filename>`.
- **Search**: search people, posts, and hashtags, with a trending-tags list.
- **Notifications**: likes, comments, follows, reposts, and @mentions all generate notifications, with unread badges and "mark all as read".
- **Profile**: avatar, bio, follower/following stats, edit-profile panel, "My Posts" / "Liked" tabs, and follow/unfollow for other users.
- **Delete post**: owners can delete their own posts from the feed, profile, or post-detail view, with a confirm dialog.

## API overview

| Method | Route                       | Description                     |
|--------|------------------------------|----------------------------------|
| POST   | /api/auth/signup             | Create an account                |
| POST   | /api/auth/login              | Log in with email/username       |
| GET    | /api/auth/me                 | Get the current user             |
| GET    | /api/posts                   | List feed (newest first)         |
| POST   | /api/posts                   | Create a post                    |
| GET    | /api/posts/:id               | Get a post + its comments        |
| POST   | /api/posts/:id/like          | Toggle like on a post            |
| POST   | /api/posts/:id/repost        | Toggle repost                    |
| POST   | /api/comments/:postId        | Add a comment to a post          |
| POST   | /api/comments/:commentId/like| Toggle like on a comment         |

All routes except signup/login require an `Authorization: Bearer <token>` header (the frontend handles this automatically once you're logged in).

## Building for production

```bash
cd frontend
npm run build     # outputs static files to frontend/dist
```

Serve `frontend/dist` with any static host (or add `express.static` to the backend) and point it at your deployed API.
