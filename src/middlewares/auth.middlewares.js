const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { JWT_SECRET } = process.env;

module.exports = isLoggedIn = catchAsync((req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        throw new AppError('Sign in before accessing this route', 401);
    }
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload) {
        throw new AppError('Token verification failed', 401);
    }
    req.user = payload;
    next();
});
