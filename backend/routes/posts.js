const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');
const { uploadBuffer, destroy } = require('../config/cloudinary');

const router = express.Router();

function extractHashtags(content) {
  const matches = content.match(/#[a-z0-9_]+/gi) || [];
  return [...new Set(matches.map((h) => h.slice(1).toLowerCase()))];
}

function extractMentions(content) {
  const matches = content.match(/@[a-z0-9_]+/gi) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

async function notifyMentions(content, actorId, postId) {
  const handles = extractMentions(content);
  if (!handles.length) return;
  const users = await User.find({ username: { $in: handles } });
  await Promise.all(
    users
      .filter((u) => u._id.toString() !== actorId)
      .map((u) =>
        Notification.create({ recipient: u._id, actor: actorId, type: 'mention', post: postId })
      )
  );
}

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

// GET /api/posts - feed, newest first. Guest-browsable. Optional ?hashtag=xyz or ?q=search
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { hashtag, q } = req.query;
    const filter = {};
    if (hashtag) filter.hashtags = hashtag.toLowerCase();
    if (q) filter.content = { $regex: q, $options: 'i' };

    const posts = await Post.find(filter).sort({ createdAt: -1 }).populate('author').limit(100);
    const withCommentCounts = await Promise.all(
      posts.map(async (p) => {
        const commentCount = await Comment.countDocuments({ post: p._id });
        return { ...serializePost(p, req.userId), commentCount };
      })
    );
    res.json({ posts: withCommentCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
});

// GET /api/posts/meta/trending - top hashtags by usage (guest-browsable)
router.get('/meta/trending', optionalAuth, async (req, res) => {
  try {
    const results = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json({ hashtags: results.map((r) => ({ tag: r._id, count: r.count })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching trending tags' });
  }
});

// POST /api/posts - create a post (multipart/form-data: content, media? [image or video])
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    const { content } = req.body;
    if ((!content || !content.trim()) && !req.file) {
      return res.status(400).json({ message: 'Post content cannot be empty' });
    }
    const hashtags = extractHashtags(content || '');

    let media = { url: null, type: null, publicId: null };
    if (req.file) {
      const resourceType = upload.resourceTypeFor(req.file.mimetype);
      const result = await uploadBuffer(req.file.buffer, { resourceType, folder: 'speakman/posts' });
      media = { url: result.secure_url, type: resourceType, publicId: result.public_id };
    }

    let post = await Post.create({
      author: req.userId,
      content: (content || '').trim(),
      media,
      hashtags,
    });
    post = await post.populate('author');

    await notifyMentions(content || '', req.userId, post._id);

    res.status(201).json({ post: { ...serializePost(post, req.userId), commentCount: 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error creating post' });
  }
});

// DELETE /api/posts/:id - delete own post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    if (post.media && post.media.publicId) {
      await destroy(post.media.publicId, post.media.type === 'video' ? 'video' : 'image');
    }
    await Comment.deleteMany({ post: post._id });
    await Notification.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

// GET /api/posts/:id - single post with comments (guest-browsable)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: 1 })
      .populate('author');

    const commentCount = comments.length;
    res.json({
      post: { ...serializePost(post, req.userId), commentCount },
      comments: comments.map((c) => ({
        id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        parentComment: c.parentComment,
        author: {
          id: c.author._id,
          fullName: c.author.fullName,
          username: c.author.username,
          avatarColor: c.author.avatarColor,
          avatarUrl: c.author.avatarUrl,
        },
        likeCount: c.likes.length,
        likedByMe: req.userId ? c.likes.some((id) => id.toString() === req.userId) : false,
        mine: req.userId ? c.author._id.toString() === req.userId : false,
        canDelete: req.userId
          ? c.author._id.toString() === req.userId || post.author.toString() === req.userId
          : false,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching post' });
  }
});

// POST /api/posts/:id/star - toggle star (replaces "like")
router.post('/:id/star', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.stars.findIndex((id) => id.toString() === req.userId);
    if (idx === -1) {
      post.stars.push(req.userId);
      if (post.author._id.toString() !== req.userId) {
        await Notification.create({ recipient: post.author._id, actor: req.userId, type: 'star', post: post._id });
      }
    } else {
      post.stars.splice(idx, 1);
    }
    await post.save();

    const commentCount = await Comment.countDocuments({ post: post._id });
    res.json({ post: { ...serializePost(post, req.userId), commentCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling star' });
  }
});

// POST /api/posts/:id/repost - toggle repost
router.post('/:id/repost', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.reposts.findIndex((id) => id.toString() === req.userId);
    if (idx === -1) {
      post.reposts.push(req.userId);
      if (post.author._id.toString() !== req.userId) {
        await Notification.create({ recipient: post.author._id, actor: req.userId, type: 'repost', post: post._id });
      }
    } else {
      post.reposts.splice(idx, 1);
    }
    await post.save();

    const commentCount = await Comment.countDocuments({ post: post._id });
    res.json({ post: { ...serializePost(post, req.userId), commentCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling repost' });
  }
});

module.exports = router;
