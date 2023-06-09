const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.models');

const { JWT_SECRET } = process.env;

module.exports = isLoggedIn = catchAsync(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new AppError('Sign in before accessing this route', 401));
    }
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload) {
        return next(new AppError('Token verification failed', 401));
    }
    const user = await User.findById(payload.id).select('+password');

    if (user.passwordChangedAt > new Date(payload.iat)) {
        return next(
            new AppError('Password was changed. Please login again', 400)
        );
    }

    req.user = user;
    next();
});
