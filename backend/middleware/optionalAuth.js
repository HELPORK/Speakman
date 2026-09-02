const jwt = require('jsonwebtoken');

// Like auth, but never rejects — used for public/guest-browsable routes
// (e.g. the discover feed) where req.userId is used if present to mark
// "starredByMe" etc, but absence just means "viewing as a guest".
module.exports = function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch (err) {
    req.userId = null;
  }
  next();
};
