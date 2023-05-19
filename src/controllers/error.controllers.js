const { log } = require('mercedlogger');

module.exports = (error, req, res, next) => {
    if (error.isOperational) {
        log.magenta('OPERATIONAL ERROR', error);
        res.status(error.statusCode).json({ message: error.message });
    } else {
        log.red('ERROR', error);
        res.status(500).json({
            message: 'Something went wrong please try again later',
        });
    }
};
