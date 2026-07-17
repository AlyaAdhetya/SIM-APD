const multer = require('multer');

// Gunakan memoryStorage agar file tidak disimpan di hardisk lokal Vercel
const memoryStorage = multer.memoryStorage();

const uploadDisk = multer({ storage: memoryStorage });
const uploadMemory = multer({ storage: memoryStorage });

const uploadProfile = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'));
    }
  }
});

module.exports = {
  uploadDisk,
  uploadMemory,
  uploadProfile
};
