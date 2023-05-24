const express = require('express');
const userController = require('../controllers/user.controllers');
const isLoggedIn = require('../middlewares/auth.middlewares');
const { isEmail, isInLength } = require('../middlewares/validation.middleware');

const userRouter = express.Router();

userRouter.post(
    '/signup',
    isEmail(),
    isInLength('password', 5),
    isInLength('passwordConfirm', 5),
    userController.signup
);
userRouter.post(
    '/login',
    isEmail(),
    isInLength('password', 5),
    userController.login
);

userRouter.post('/forgot-password', isEmail(), userController.forgotPassword);

userRouter.post(
    '/reset-password/:token',
    isInLength('newPassword', 5),
    isInLength('newPasswordConfirm', 5),
    userController.resetPassword
);

userRouter.use(isLoggedIn);

userRouter.post(
    '/delete',
    isInLength('passwordConfirm', 5),
    userController.delete
);
userRouter.post('/logout', isLoggedIn, userController.logout);

userRouter.post(
    '/update-password',
    isInLength('passwordConfirm', 5),
    isInLength('newPassword', 5),
    isInLength('newPasswordConfirm', 5),
    userController.updatePassword
);

userRouter.post(
    '/upload-photo',
    isLoggedIn,
    userController.uploadUserPhotoMiddleware,
    userController.uploadUserPhoto
);

module.exports = userRouter;
