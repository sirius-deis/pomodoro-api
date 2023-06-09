const express = require('express');
const cors = require('cors');
const cookieParse = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const isLoggedIn = require('./middlewares/auth.middlewares');
const userRouter = require('./routes/user.routes');
const taskRouter = require('./routes/task.routes');

const errorGlobalHandler = require('./controllers/error.controllers');

const app = express();

const corsOptions = {
    origin: true,
    credentials: true,
};

const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour',
});

/**
 * Middleware
 */

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('tiny'));
}
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParse());
app.use(helmet());
app.use(mongoSanitize());
app.use(limiter);

/**
 * Routes
 */
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tasks', isLoggedIn, taskRouter);

/**
 * Not found route
 */
app.all('*', (req, res, next) => {
    return next(
        new AppError(`Can\'t find ${req.originalUrl} on this server`, 404)
    );
});

app.use(errorGlobalHandler);

module.exports = app;
