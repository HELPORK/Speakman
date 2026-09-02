const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    media: {
      url: { type: String, default: null },
      type: { type: String, enum: ['image', 'video', null], default: null },
      publicId: { type: String, default: null },
    },
    hashtags: [{ type: String, lowercase: true, trim: true }],
    stars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
