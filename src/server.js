require('dotenv').config();
const { log } = require('mercedlogger');
const app = require('./app');
const connect = require('./db/connection');

const { PORT = 3000 } = process.env;

const start = () => {
    try {
        app.listen(PORT, () => {
            log.green('SERVER STATE', `Server is running on port: ${PORT}`);
        });
        connect();
    } catch (error) {
        log.red('SERVER STATE', error);
        process.exit(1);
    }
};

start();
