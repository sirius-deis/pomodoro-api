const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.models');

exports.signup = catchAsync(async (req, res) => {
    console.log('sign up');
    const { email, password, passwordConfirm } = req.body;
    if (!email || !password || !passwordConfirm) {
        console.log('sign up 1');
        throw new AppError('Please provide all fields with valid data', 400);
    }
    if (
        email.trim().length < 5 ||
        password.trim().length < 5 ||
        passwordConfirm.trim().length < 5
    ) {
        console.log('sign up 2');
        throw new AppError('Please provide valid data', 400);
    }
    if (password !== passwordConfirm) {
        console.log('sign up 3');
        throw new AppError(
            'Password are different, please provide valid passwords',
            400
        );
    }
    console.log('sign up 4');
    await User.create({ email, password });
    res.status(201).json({ message: 'Account was successfully created' });
});
