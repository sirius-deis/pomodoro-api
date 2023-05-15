const mongoose = require('mongoose');

const useSchema = new mongoose.Schema({
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

const User = mongoose.model('user', useSchema);

module.exports = User;
