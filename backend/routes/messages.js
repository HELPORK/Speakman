const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

function serializeMessage(m, userId) {
  return {
    id: m._id,
    text: m.text,
    createdAt: m.createdAt,
    read: m.read,
    mine: m.sender.toString() === userId,
    sharedPost: m.sharedPost
      ? {
          id: m.sharedPost._id,
          content: m.sharedPost.content,
          media: m.sharedPost.media && m.sharedPost.media.url
            ? { url: m.sharedPost.media.url, type: m.sharedPost.media.type }
            : null,
          author: m.sharedPost.author
            ? { username: m.sharedPost.author.username, fullName: m.sharedPost.author.fullName }
            : null,
        }
      : null,
  };
}

// GET /api/messages/conversations - list of conversation partners with last message + unread count
router.get('/conversations', auth, async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.userId);
    const results = await Message.aggregate([
      { $match: { $or: [{ sender: myId }, { recipient: myId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', myId] }, '$recipient', '$sender'],
          },
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$recipient', myId] }, { $eq: ['$read', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    const partnerIds = results.map((r) => r._id);
    const partners = await User.find({ _id: { $in: partnerIds } });
    const partnerMap = new Map(partners.map((p) => [p._id.toString(), p]));

    const conversations = results
      .filter((r) => partnerMap.has(r._id.toString()))
      .map((r) => {
        const partner = partnerMap.get(r._id.toString());
        return {
          user: partner.toPublicJSON(req.userId),
          lastMessage: {
            text: r.lastMessage.text,
            createdAt: r.lastMessage.createdAt,
            mine: r.lastMessage.sender.toString() === req.userId,
            sharedPost: !!r.lastMessage.sharedPost,
          },
          unread: r.unread,
        };
      });

    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// GET /api/messages/:username - full thread with a user, marks their messages as read
router.get('/:username', auth, async (req, res) => {
  try {
    const partner = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!partner) return res.status(404).json({ message: 'User not found' });

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: partner._id },
        { sender: partner._id, recipient: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate({ path: 'sharedPost', populate: { path: 'author' } });

    await Message.updateMany(
      { sender: partner._id, recipient: req.userId, read: false },
      { read: true }
    );

    res.json({
      partner: partner.toPublicJSON(req.userId),
      messages: messages.map((m) => serializeMessage(m, req.userId)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching thread' });
  }
});

// POST /api/messages/:username - send a message (text and/or a shared post)
router.post('/:username', auth, async (req, res) => {
  try {
    const partner = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!partner) return res.status(404).json({ message: 'User not found' });
    if (partner._id.toString() === req.userId) {
      return res.status(400).json({ message: "You can't message yourself" });
    }

    const { text, sharedPostId } = req.body;
    if ((!text || !text.trim()) && !sharedPostId) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    let message = await Message.create({
      sender: req.userId,
      recipient: partner._id,
      text: (text || '').trim(),
      sharedPost: sharedPostId || null,
    });
    message = await message.populate({ path: 'sharedPost', populate: { path: 'author' } });

    res.status(201).json({ message: serializeMessage(message, req.userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// GET /api/messages/meta/unread-count
router.get('/meta/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error counting messages' });
  }
});

module.exports = router;
