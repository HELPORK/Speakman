const multer = require('multer');

// We use memory storage because files are uploaded straight through to
// Cloudinary (see config/cloudinary.js) rather than saved to local disk.
const storage = multer.memoryStorage();

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

function fileFilter(req, file, cb) {
  if (ALLOWED_IMAGE.includes(file.mimetype) || ALLOWED_VIDEO.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image (jpeg, png, gif, webp) or video (mp4, webm, mov, ogg) files are allowed'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB, generous enough for short video clips
});

function resourceTypeFor(mimetype) {
  return ALLOWED_VIDEO.includes(mimetype) ? 'video' : 'image';
}

module.exports = upload;
module.exports.resourceTypeFor = resourceTypeFor;
module.exports.ALLOWED_IMAGE = ALLOWED_IMAGE;
module.exports.ALLOWED_VIDEO = ALLOWED_VIDEO;
