const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

function serialize(n) {
  return {
    id: n._id,
    type: n.type,
    createdAt: n.createdAt,
    read: n.read,
    actor: {
      id: n.actor._id,
      fullName: n.actor.fullName,
      username: n.actor.username,
      avatarColor: n.actor.avatarColor,
    },
    post: n.post ? { id: n.post._id, content: n.post.content, media: n.post.media && n.post.media.url ? { url: n.post.media.url, type: n.post.media.type } : null } : null,
  };
}

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .populate('actor')
      .populate('post')
      .limit(100);
    res.json({ notifications: notifications.map(serialize) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error marking notifications read' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error counting notifications' });
  }
});

module.exports = router;
