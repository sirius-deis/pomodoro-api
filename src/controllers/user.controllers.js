const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.models');
const Token = require('../models/token.models');
const sendEmail = require('../utils/email');
const utils = require('../utils/utils');

/**
 * Config
 */
const multerStorage = multer.memoryStorage();

const upload = multer({ storage: multerStorage });

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT, PORT, IMG_FOLDER } =
    process.env;

/**
 * Helper functions
 */
const checkIfFieldsAreEmpty = (next, ...fields) => {
    const isNotValid = fields.some(field => !(field.length >= 4));
    if (isNotValid) {
        next(new AppError('Please provide valid data', 400));
        return true;
    }
};

const signToken = id => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const checkIfUserPasswordCorrect = async (next, user, assumedPassword) => {
    if (!user || !(await user.checkPassword(assumedPassword, user.password))) {
        next(new AppError('Incorrect email or password', 401));
        return false;
    }
    return true;
};

const checkIfPasswordsAreTheSame = (next, password1, password2) => {
    if (password1 !== password2) {
        next(
            new AppError(
                'Passwords are different, please provide valid passwords',
                400
            )
        );
        return false;
    }
    return true;
};

const sendResponseWithToken = (user, req, res, statusCode, message) => {
    const token = signToken(user.id);
    res.cookie('token', token, {
        expires: new Date(
            Date.now() + parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
    });

    user.password = undefined;
    res.status(statusCode).json({
        message,
        data: { user },
    });
};

const deleteResetTokenIfExist = async userId => {
    const token = await Token.findOne({ userId });
    if (token) {
        await token.deleteOne();
    }
};

const createResetToken = async () => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, +BCRYPT_SALT);
    return hash;
};

/**
 * Controllers
 */
exports.signup = catchAsync(async (req, res, next) => {
    const { email, password, passwordConfirm } = req.body;

    if (utils.checkIfFieldsExist(next, email, password, passwordConfirm)) {
        return;
    }
    if (checkIfFieldsAreEmpty(next, email, password, passwordConfirm)) {
        return;
    }
    if (!checkIfPasswordsAreTheSame(next, password, passwordConfirm)) {
        return;
    }

    await User.create({ email, password });
    res.redirect(201, '/login');
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (utils.checkIfFieldsExist(next, email, password)) {
        return;
    }
    if (checkIfFieldsAreEmpty(next, email, password)) {
        return;
    }

    const user = await User.findOne({ email }).select('+password -__v');

    if (!(await checkIfUserPasswordCorrect(next, user, password))) {
        return;
    }

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

exports.delete = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { password } = req.body;

    if (utils.checkIfFieldsExist(next, password)) {
        return;
    }
    if (checkIfFieldsAreEmpty(next, password)) {
        return;
    }
    if (!(await checkIfUserPasswordCorrect(next, user, password))) {
        return;
    }
    try {
        const photoPath = user.profilePicture;
        await fs.unlink(path.resolve(__dirname, '..', photoPath));
    } catch {}

    await user.deleteOne();
    res.clearCookie('token');

    res.redirect('/');
});

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
};

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { passwordConfirm, newPassword, newPasswordConfirm } = req.body;
    if (
        utils.checkIfFieldsExist(
            next,
            passwordConfirm,
            newPassword,
            newPasswordConfirm
        )
    ) {
        return;
    }
    if (
        checkIfFieldsAreEmpty(
            next,
            passwordConfirm,
            newPassword,
            newPasswordConfirm
        )
    ) {
        return;
    }

    if (!(await checkIfUserPasswordCorrect(next, user, passwordConfirm))) {
        return;
    }
    if (!checkIfPasswordsAreTheSame(next, newPassword, newPasswordConfirm)) {
        return;
    }
    if (passwordConfirm === newPassword) {
        return next(
            new AppError(
                "A new password can't be the same as the previous",
                400
            )
        );
    }

    user.password = newPassword;
    await user.save();

    sendResponseWithToken(
        user,
        req,
        res,
        200,
        "You'r password was updated successfully"
    );
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(
            new AppError('There is no user with such email address', 404)
        );
    }
    await deleteResetTokenIfExist(user._id);
    const hash = await createResetToken();
    await Token.create({ userId: user._id, token: hash });

    const link = `${req.protocol}://${req.hostname}:${PORT}${req.baseUrl}/reset-password/${hash}`;
    await sendEmail(user.email, 'Password reset token', link);
    res.status(200).json({ message: 'Token was sent to email' });
});

exports.resetPassword = catchAsync(async (req, res) => {
    const { token: tokenFromParams } = req.params;
    const { newPassword, newPasswordConfirm } = req.body;

    const token = await Token.findOne({
        token: tokenFromParams,
    });

    if (!token) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    if (utils.checkIfFieldsExist(next, newPassword, newPasswordConfirm)) {
        return;
    }
    if (checkIfFieldsAreEmpty(next, newPassword, newPasswordConfirm)) {
        return;
    }
    if (!checkIfPasswordsAreTheSame(next, newPassword, newPasswordConfirm)) {
        return;
    }

    const user = await User.findById(token.userId);
    user.password = newPassword;

    await user.save();

    await token.deleteOne();

    res.redirect(200, '/');
});

exports.uploadUserPhotoMiddleware = upload.single('photo');

exports.uploadUserPhoto = catchAsync(async (req, res) => {
    if (!req.file) {
        throw new AppError(
            'Image should be provided! Please provide an image',
            400
        );
    }
    if (!req.file.mimetype.startsWith('image')) {
        return next(new AppError('Not an image! Please provide an image', 400));
    }

    const user = req.user;
    const dirPath = path.resolve(__dirname, '..', IMG_FOLDER);

    try {
        await fs.access(`${dirPath}`);
    } catch {
        await fs.mkdir(`${dirPath}`, {
            recursive: true,
        });
    }

    const { buffer, originalname } = req.file;
    const timestamp = new Date().toISOString();
    const name = `${timestamp}-${originalname}`;

    const currentPath = user.profilePicture;

    user.profilePicture = `${IMG_FOLDER}/${name}`;
    await user.save();
    try {
        await fs.unlink(path.resolve(__dirname, '..', currentPath));
    } catch {}

    await sharp(buffer)
        .resize(200, 200)
        .toFormat('jpeg')
        .jpeg({ quality: 50 })
        .toFile(`${dirPath}/${name}`);

    res.status(201).json({ message: 'Photo was updated successfully' });
});
