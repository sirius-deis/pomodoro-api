const AppError = function (message, statusCode) {
    Error.prototype.constructor.call(this, message);
    this.message = message;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
};

AppError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: AppError,
        enumerable: false,
        writable: true,
        configurable: true,
    },
});

module.exports = AppError;
