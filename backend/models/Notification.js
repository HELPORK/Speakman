const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['star', 'comment', 'follow', 'repost', 'mention'],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
