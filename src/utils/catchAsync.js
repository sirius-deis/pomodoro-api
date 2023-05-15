const { log } = require('mercedlogger');

const { MODE } = process.env;

module.exports = catchAsync = fn => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            log.red('SERVER ERROR', error);
            res.status(error.statusCode ?? 500).json({
                message:
                    error.isOperational || MODE === 'development'
                        ? error.message
                        : 'Something went wrong',
            });
        }
    };
};
