const express = require('express');
const userController = require('../controllers/user.controllers');
const isLoggedIn = require('../middlewares/auth.middlewares');

const userRouter = express.Router();

userRouter.post('/signup', userController.signup);
userRouter.post('/login', userController.login);
userRouter.post('/delete', isLoggedIn, userController.delete);
userRouter.post('/logout', isLoggedIn, userController.logout);
userRouter.post('/update-password', isLoggedIn, userController.updatePassword);

module.exports = userRouter;
