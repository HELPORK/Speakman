const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    avatarColor: { type: String, default: '#22C55E' },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    bio: { type: String, default: '', trim: true, maxlength: 160 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toPublicJSON = function (viewerId) {
  return {
    id: this._id,
    fullName: this.fullName,
    username: this.username,
    email: this.email,
    avatarColor: this.avatarColor,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    followerCount: this.followers.length,
    followingCount: this.following.length,
    followedByMe: viewerId ? this.followers.some((id) => id.toString() === viewerId) : false,
  };
};

module.exports = mongoose.model('User', UserSchema);
