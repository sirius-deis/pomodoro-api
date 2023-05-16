const nodemailer = require('nodemailer');

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({});
    } catch (error) {}
};

module.exports = sendEmail;
