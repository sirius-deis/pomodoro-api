const mongoose = require('mongoose');
const { log } = require('mercedlogger');

const { DB_NAME } = process.env.DB_NAME;

const connect = () => {
    mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    mongoose.connection
        .on('open', () => log.green('DATABASE STATE', 'Connection established'))
        .on('close', () => log.magenta('DATABASE STATE', 'Connection closed'))
        .on('error', error => log.red('DATABASE STATE', error));
};

module.exports = connect;
