const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

function serializeComment(comment, userId, post) {
  return {
    id: comment._id,
    content: comment.content,
    createdAt: comment.createdAt,
    parentComment: comment.parentComment,
    author: {
      id: comment.author._id,
      fullName: comment.author.fullName,
      username: comment.author.username,
      avatarColor: comment.author.avatarColor,
      avatarUrl: comment.author.avatarUrl,
    },
    likeCount: comment.likes.length,
    likedByMe: userId ? comment.likes.some((id) => id.toString() === userId) : false,
    mine: userId ? comment.author._id.toString() === userId : false,
    canDelete: userId
      ? comment.author._id.toString() === userId || post.author.toString() === userId
      : false,
  };
}

// POST /api/comments/:postId - add comment or reply to a post
router.post('/:postId', auth, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.post.toString() !== post._id.toString()) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
    }

    let comment = await Comment.create({
      post: post._id,
      author: req.userId,
      content: content.trim(),
      parentComment: parentComment ? parentComment._id : null,
    });
    comment = await comment.populate('author');

    const notifyTarget = parentComment ? parentComment.author : post.author;
    if (notifyTarget.toString() !== req.userId) {
      await Notification.create({
        recipient: notifyTarget,
        actor: req.userId,
        type: 'comment',
        post: post._id,
      });
    }

    res.status(201).json({ comment: serializeComment(comment, req.userId, post) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// DELETE /api/comments/:commentId - delete a comment.
// Allowed for: the comment's own author, OR the author of the post it's on.
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const post = await Post.findById(comment.post);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwnComment = comment.author.toString() === req.userId;
    const isPostOwner = post.author.toString() === req.userId;
    if (!isOwnComment && !isPostOwner) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Also remove any direct replies to this comment.
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

// POST /api/comments/:commentId/like - toggle like on comment
router.post('/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const idx = comment.likes.findIndex((id) => id.toString() === req.userId);
    if (idx === -1) comment.likes.push(req.userId);
    else comment.likes.splice(idx, 1);
    await comment.save();

    res.json({
      likeCount: comment.likes.length,
      likedByMe: comment.likes.some((id) => id.toString() === req.userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error toggling comment like' });
  }
});

module.exports = router;
