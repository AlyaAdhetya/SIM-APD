const jwt = require('jsonwebtoken');
const { jsonError } = require('../helpers/response');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError(res, 'Akses ditolak. Token tidak ditemukan.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return jsonError(res, 'Token tidak valid atau sudah kedaluwarsa.', 401);
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return jsonError(res, 'Akses ditolak. Anda tidak memiliki izin untuk resource ini.', 403);
    }
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};
