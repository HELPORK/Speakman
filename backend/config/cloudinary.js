const cloudinary = require('cloudinary').v2;

const isConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Uploads a buffer (from multer memoryStorage) to Cloudinary.
// resourceType: 'image' | 'video'
function uploadBuffer(buffer, { resourceType = 'image', folder = 'speakman' } = {}) {
  if (!isConfigured) {
    return Promise.reject(
      new Error(
        'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to backend/.env'
      )
    );
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

function destroy(publicId, resourceType = 'image') {
  if (!isConfigured || !publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {});
}

module.exports = { cloudinary, isConfigured, uploadBuffer, destroy };
