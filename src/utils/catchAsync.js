module.exports = catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(error =>
            res.status(error.statusCode ?? 400).json({
                message: error.isOperational
                    ? error.message
                    : 'Something went wrong',
            })
        );
    };
};
