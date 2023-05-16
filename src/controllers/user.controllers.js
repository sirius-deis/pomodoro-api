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

const checkIfUserPasswordCorrect = async (user, assumedPassword) => {
    if (!user || !(await user.checkPassword(assumedPassword, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }
};

const checkIfPasswordsAreTheSame = (password1, password2) => {
    if (password1 !== password2) {
        throw new AppError(
            'Passwords are different, please provide valid passwords',
            400
        );
    }
};

const sendResponseWithToken = (user, req, res, statusCode, message) => {
    const token = signToken(user.id);
    res.cookie('token', token, {
        expires: new Date(
            Date.now() + parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
    });

    res.status(statusCode).json({
        message,
        data: { user },
    });
};

exports.signup = catchAsync(async (req, res) => {
    const { email, password, passwordConfirm } = req.body;

    checkIfFieldsExist(email, password, passwordConfirm);
    checkIfFieldsAreNotEmpty(email, password, passwordConfirm);
    checkIfPasswordsAreTheSame(password, passwordConfirm);
    await User.create({ email, password });
    res.status(201).json({ message: 'Account was successfully created' });
});

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    checkIfFieldsExist(email, password);
    checkIfFieldsAreNotEmpty(email, password);
    const user = await User.findOne({ email }).select('+password -__v');
    await checkIfUserPasswordCorrect(user, password);

    user.password = undefined;
    res.cookie('token', signToken(user._id), {
        expires: new Date(
            Date.now() + parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
    });
    sendResponseWithToken(
        user,
        req,
        res,
        200,
        'You was logged in successfully'
    );
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
    await checkIfUserPasswordCorrect(user, password);
    await User.findByIdAndRemove(user._id);
    res.clearCookie('token');

    res.status(204).json({ message: 'Your account was deleted successfully' });
});

exports.logout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

exports.updatePassword = catchAsync(async (req, res) => {
    const { id } = req.user;
    const { passwordConfirm, newPassword, newPasswordConfirm } = req.body;
    checkIfFieldsExist(passwordConfirm, newPassword, newPasswordConfirm);
    checkIfFieldsAreNotEmpty(passwordConfirm, newPassword, newPasswordConfirm);
    const user = await User.findById(id).select('+password -__v');
    await checkIfUserPasswordCorrect(user, passwordConfirm);
    checkIfPasswordsAreTheSame(newPassword, newPasswordConfirm);
    if (passwordConfirm === newPassword) {
        throw new AppError(
            "A new password can't be the same as the previous",
            400
        );
    }

    user.password = newPassword;
    console.log(user);
    await user.save();

    sendResponseWithToken(
        user,
        req,
        res,
        200,
        "You'r password was updated successfully"
    );
});

exports.forgotPassword = catchAsync(async (req, res) => {});
