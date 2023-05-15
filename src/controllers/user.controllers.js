const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.models');

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const checkIfFieldsExist = (...fields) => {
    return fields.some(field => !field);
};

const checkIfFieldsAreNotEmpty = (...fields) => {
    return fields.some(field => !(field.length >= 5));
};

const signToken = id => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

exports.signup = catchAsync(async (req, res) => {
    const { email, password, passwordConfirm } = req.body;

    if (checkIfFieldsExist(email, password, passwordConfirm)) {
        throw new AppError('Please provide all fields with valid data', 400);
    }
    if (checkIfFieldsAreNotEmpty(email, password, passwordConfirm)) {
        throw new AppError('Please provide valid data', 400);
    }
    if (password !== passwordConfirm) {
        throw new AppError(
            'Password are different, please provide valid passwords',
            400
        );
    }
    await User.create({ email, password });
    res.status(201).json({ message: 'Account was successfully created' });
});

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    if (checkIfFieldsExist(email, password)) {
        throw new AppError('Please provide all fields with valid data', 400);
    }
    if (checkIfFieldsAreNotEmpty(email, password)) {
        throw new AppError('Please provide valid data', 400);
    }
    const user = await User.findOne({ email }).select('+password -__v');
    if (!user || !(await user.checkPassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }
    user.password = undefined;
    res.cookie('token', signToken(user._id), {
        expires: new Date(
            Date.now() + parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
    });

    return res
        .status(200)
        .json({ message: 'You was logged in successfully', data: { user } });
});
