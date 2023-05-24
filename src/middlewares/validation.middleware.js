const { body } = require('express-validator');

exports.isEmail = () => body('email').trim().isEmail().escape();

exports.isInLength = (field, min = 4, max) =>
    body(field).trim().isLength({ min, max }).escape();

exports.isBoolean = field => body(field).isBoolean();

exports.isNumberInRange = (field, min = 0, max = 5) =>
    body(field).isInt({ min, max });
