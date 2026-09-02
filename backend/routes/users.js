const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');
const { uploadBuffer, destroy } = require('../config/cloudinary');

const router = express.Router();

function serializePost(post, userId) {
  const author = post.author;
  return {
    id: post._id,
    content: post.content,
    media: post.media && post.media.url ? { url: post.media.url, type: post.media.type } : null,
    hashtags: post.hashtags,
    createdAt: post.createdAt,
    author: {
      id: author._id,
      fullName: author.fullName,
      username: author.username,
      avatarColor: author.avatarColor,
      avatarUrl: author.avatarUrl,
    },
    starCount: post.stars.length,
    repostCount: post.reposts.length,
    starredByMe: userId ? post.stars.some((id) => id.toString() === userId) : false,
    repostedByMe: userId ? post.reposts.some((id) => id.toString() === userId) : false,
    mine: userId ? author._id.toString() === userId : false,
  };
}

// GET /api/users/search?q=term - search people by name or user ID (username). Guest-browsable.
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      // No query yet — suggest a handful of people to discover.
      const filter = req.userId ? { _id: { $ne: req.userId } } : {};
      const suggested = await User.find(filter).sort({ createdAt: -1 }).limit(5);
      return res.json({ users: suggested.map((u) => u.toPublicJSON(req.userId)) });
    }
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
    }).limit(20);
    res.json({ users: users.map((u) => u.toPublicJSON(req.userId)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

// PUT /api/users/me - edit own profile (fields) + optional avatar image upload
router.put('/me', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, bio } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio.trim().slice(0, 160);

    if (req.file) {
      if (req.file.mimetype.startsWith('video/')) {
        return res.status(400).json({ message: 'Profile picture must be an image' });
      }
      const result = await uploadBuffer(req.file.buffer, { resourceType: 'image', folder: 'speakman/avatars' });
      if (user.avatarPublicId) await destroy(user.avatarPublicId, 'image');
      user.avatarUrl = result.secure_url;
      user.avatarPublicId = result.public_id;
    }

    await user.save();
    res.json({ user: user.toPublicJSON(req.userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error updating profile' });
  }
});

// GET /api/users/:username - public profile + their posts. Guest-browsable.
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).populate('author');
    const withCounts = await Promise.all(
      posts.map(async (p) => {
        const commentCount = await Comment.countDocuments({ post: p._id });
        return { ...serializePost(p, req.userId), commentCount };
      })
    );

    res.json({ user: user.toPublicJSON(req.userId), posts: withCounts, postCount: posts.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// GET /api/users/:username/starred - posts this user has starred
router.get('/:username/starred', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ stars: user._id }).sort({ createdAt: -1 }).populate('author');
    const withCounts = await Promise.all(
      posts.map(async (p) => {
        const commentCount = await Comment.countDocuments({ post: p._id });
        return { ...serializePost(p, req.userId), commentCount };
      })
    );
    res.json({ posts: withCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching starred posts' });
  }
});

// GET /api/users/:username/reposts - posts this user has reposted
router.get('/:username/reposts', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ reposts: user._id }).sort({ createdAt: -1 }).populate('author');
    const withCounts = await Promise.all(
      posts.map(async (p) => {
        const commentCount = await Comment.countDocuments({ post: p._id });
        return { ...serializePost(p, req.userId), commentCount };
      })
    );
    res.json({ posts: withCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching reposts' });
  }
});

// GET /api/users/:username/followers - people who follow this user
router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).populate('followers');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ users: user.followers.map((u) => u.toPublicJSON(req.userId)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching followers' });
  }
});

// GET /api/users/:username/following - people this user follows
router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).populate('following');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ users: user.following.map((u) => u.toPublicJSON(req.userId)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching following' });
  }
});

// POST /api/users/:id/follow - toggle follow
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.userId);
    if (!target || !me) return res.status(404).json({ message: 'User not found' });

    const idx = target.followers.findIndex((id) => id.toString() === req.userId);
    if (idx === -1) {
      target.followers.push(req.userId);
      me.following.push(target._id);
      await Notification.create({ recipient: target._id, actor: req.userId, type: 'follow' });
    } else {
      target.followers.splice(idx, 1);
      me.following = me.following.filter((id) => id.toString() !== target._id.toString());
    }
    await target.save();
    await me.save();

    res.json({ user: target.toPublicJSON(req.userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling follow' });
  }
});

module.exports = router;
