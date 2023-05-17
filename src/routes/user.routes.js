const express = require('express');
const userController = require('../controllers/user.controllers');
const isLoggedIn = require('../middlewares/auth.middlewares');

const userRouter = express.Router();

userRouter.post('/signup', userController.signup);
userRouter.post('/login', userController.login);
userRouter.post('/delete', isLoggedIn, userController.delete);
userRouter.post('/logout', isLoggedIn, userController.logout);
userRouter.post('/update-password', isLoggedIn, userController.updatePassword);
userRouter.post('/forgot-password', userController.forgotPassword);
userRouter.post('/reset-password/:token', userController.resetPassword);
userRouter.post(
    '/upload-photo',
    isLoggedIn,
    userController.uploadUserPhotoMiddleware,
    userController.uploadUserPhoto
);

module.exports = userRouter;
