const { log } = require('mercedlogger');

module.exports = catchAsync = fn => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            log.red('SERVER ERROR', error);
            res.status(error.statusCode ?? 500).json({
                message: error.isOperational
                    ? error.message
                    : 'Something went wrong',
            });
        }
    };
};
