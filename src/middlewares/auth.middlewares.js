const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');

const { JWT_SECRET } = process.env;

module.exports = isLoggedIn = (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        throw new AppError('Sign in before accessing this route', 401);
    }
    const payload = jwt.verify(jwt, JWT_SECRET);
    if (!payload) {
        throw new AppError('Token verification failed', 401);
    }
    req.user = payload;
    next();
};
