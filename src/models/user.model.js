const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [
            'true',
            "This field can't be blank. Please provide valid email address",
        ],
        lowercase: true,
        unique: true,
    },
    password: {
        type: String,
        required: [
            'true',
            "This field can't be blank. Please provide a strong password",
        ],
    },
    passwordChangedAt: {
        type: Date,
        select: false,
    },
});

UserSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    this.passwordChangedAt = Date.now() - 1000;
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.methods.checkPassword = async (assumedPassword, userPassword) => {
    return await bcrypt.compare(assumedPassword, userPassword);
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
