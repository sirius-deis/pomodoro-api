const nodemailer = require('nodemailer');
const { log } = require('mercedlogger');

const AppError = require('./appError');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject,
            text,
        });

        log.green('MAILER STATUS', 'Email was sent successfully');
    } catch (error) {
        log.red('MAILER STATUS', error);
        throw new Error(error);
    }
};

module.exports = sendEmail;
