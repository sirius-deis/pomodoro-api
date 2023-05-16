const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.models');

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const checkIfFieldsExist = (...fields) => {
    const isNotValid = fields.some(field => !field);
    if (isNotValid) {
        throw new AppError('Please provide all fields with valid data', 400);
    }
};

const checkIfFieldsAreNotEmpty = (...fields) => {
    const isNotValid = fields.some(field => !(field.length >= 5));
    if (isNotValid) {
        throw new AppError('Please provide valid data', 400);
    }
};

const signToken = id => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const comparePasswords = async (user, assumedPassword) => {
    if (!user || !(await user.checkPassword(assumedPassword, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }
};

exports.signup = catchAsync(async (req, res) => {
    const { email, password, passwordConfirm } = req.body;

    checkIfFieldsExist(email, password, passwordConfirm);
    checkIfFieldsAreNotEmpty(email, password, passwordConfirm);
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

    checkIfFieldsExist(email, password);
    checkIfFieldsAreNotEmpty(email, password);
    const user = await User.findOne({ email }).select('+password -__v');
    await comparePasswords(user, password);

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

exports.delete = catchAsync(async (req, res) => {
    const { id } = req.user;
    const { password } = req.body;
    if (!id) {
        throw new AppError('You must be signed in for this operation', 401);
    }
    checkIfFieldsExist(password);
    checkIfFieldsAreNotEmpty(password);
    const user = await User.findById(id).select('+password -__v');
    await comparePasswords(user, password);
    await User.findByIdAndRemove(user._id);
    res.clearCookie('token');

    res.status(204).json({ message: 'Your account was deleted successfully' });
});

exports.logout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});
