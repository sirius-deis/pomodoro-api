const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { BCRYPT_SALT } = process.env;

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [
                'true',
                "This field can't be blank. Please provide valid email address",
            ],
            lowercase: true,
            unique: true,
            min: [5, "Email can't be less then 5 characters"],
        },
        password: {
            type: String,
            required: [
                'true',
                "This field can't be blank. Please provide a strong password",
            ],
            min: [5, "Password can't be less then 5 characters"],
        },
        passwordChangedAt: {
            type: Date,
            select: false,
        },
    },
    { timestamps: true }
);

UserSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, +BCRYPT_SALT);
    next();
});

UserSchema.methods.checkPassword = async (assumedPassword, userPassword) => {
    return await bcrypt.compare(assumedPassword, userPassword);
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
