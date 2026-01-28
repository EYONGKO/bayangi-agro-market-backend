import { verifyJwt } from '../utils/jwt.js';

export function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    const decoded = verifyJwt(token);
    req.user = decoded;
    next();
  } catch (e) {
    const err = new Error('Unauthorized');
    err.status = 401;
    next(err);
  }
}

export function requireAdmin(req, _res, next) {
  const raw = process.env.ADMIN_EMAILS || '';
  const allow = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const email = (req.user?.email || '').toLowerCase();
  if (!email || !allow.includes(email)) {
    const err = new Error('Forbidden');
    err.status = 403;
    return next(err);
  }
  return next();
}
