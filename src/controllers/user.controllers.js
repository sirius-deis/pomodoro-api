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
const checkIfFieldsExist = (next, ...fields) => {
    const isNotValid = fields.some(field => !field);
    if (isNotValid) {
        return next(
            new AppError('Please provide all fields with valid data', 400)
        );
    }
};

const checkIfFieldsAreNotEmpty = (next, ...fields) => {
    const isNotValid = fields.some(field => !(field.length >= 5));
    if (isNotValid) {
        return next(new AppError('Please provide valid data', 400));
    }
};

const signToken = id => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const checkIfUserPasswordCorrect = async (next, user, assumedPassword) => {
    if (!user || !(await user.checkPassword(assumedPassword, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
};

const checkIfPasswordsAreTheSame = (next, password1, password2) => {
    if (password1 !== password2) {
        return next(
            new AppError(
                'Passwords are different, please provide valid passwords',
                400
            )
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

    checkIfFieldsExist(next, email, password, passwordConfirm);
    checkIfFieldsAreNotEmpty(next, email, password, passwordConfirm);
    checkIfPasswordsAreTheSame(next, password, passwordConfirm);
    await User.create({ email, password });
    res.redirect(201, '/login');
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    checkIfFieldsExist(next, email, password);
    checkIfFieldsAreNotEmpty(next, email, password);
    const user = await User.findOne({ email }).select('+password -__v');
    await checkIfUserPasswordCorrect(next, user, password);

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
    const { id } = req.user;
    const { password } = req.body;
    if (!id) {
        return next(
            new AppError('You must be signed in for this operation', 401)
        );
    }
    checkIfFieldsExist(next, password);
    checkIfFieldsAreNotEmpty(next, password);
    const user = await User.findById(id).select('+password -__v');
    await checkIfUserPasswordCorrect(next, user, password);
    try {
        const photoPath = user.profilePicture;
        await fs.unlink(path.resolve(__dirname, '..', photoPath));
    } catch {}
    await user.deleteOne();
    res.clearCookie('token');

    res.redirect(204, '/');
});

exports.logout = catchAsync(async (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const { passwordConfirm, newPassword, newPasswordConfirm } = req.body;
    checkIfFieldsExist(next, passwordConfirm, newPassword, newPasswordConfirm);
    checkIfFieldsAreNotEmpty(
        next,
        passwordConfirm,
        newPassword,
        newPasswordConfirm
    );
    const user = await User.findById(id).select('+password -__v');
    await checkIfUserPasswordCorrect(next, user, passwordConfirm);
    checkIfPasswordsAreTheSame(next, newPassword, newPasswordConfirm);
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

    checkIfFieldsExist(next, newPassword, newPasswordConfirm);
    checkIfFieldsAreNotEmpty(next, newPassword, newPasswordConfirm);
    checkIfPasswordsAreTheSame(next, newPassword, newPasswordConfirm);

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

    const { id } = req.user;
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

    const user = await User.findById(id);
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
