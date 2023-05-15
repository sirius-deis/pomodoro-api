const express = require('express');
const userController = require('../controllers/user.controllers');

const userRouter = express.Router();

userRouter.post('/signup', userController.signup);

module.exports = userRouter;
