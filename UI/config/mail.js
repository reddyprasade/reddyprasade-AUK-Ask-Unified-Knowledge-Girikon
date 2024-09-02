const {createTransport} = require('nodemailer');
const {template} = require("./mail.templates");
const Transport = require("nodemailer-brevo-transport");
const transporter = createTransport(new Transport({apiKey: process.env.EMAIL_AUTH_KEY}));

// const transporter = createTransport({
//     host: process.env.EMAIL_USER,//smtp-relay.sendinblue.com
//     port: parseInt(process.env.EMAIL_PORT),
//     auth: {
//         user: process.env.EMAIL_AUTH_USER,
//         pass: process.env.EMAIL_AUTH_PASS,
//     },
// });
// const mailOptions = {
//     from: 'support@girikon.ai',
//     to: 'arun@girikon.com',
//     subject: `Your subject`,
//     text: `Your text content`
// };

const sendEmail = (mailOptions) => {
	try {
		console.info("sendEmail");
		mailOptions.from = mailOptions.from || process.env.MAIL_FROM || 'support@girikon.ai';
		mailOptions.html = template(mailOptions.body);
		return new Promise((resolve, reject) => {
			try {
				if (!mailOptions.to) {
					resolve('Email address is required');
				}
				else {
					transporter.sendMail({
						to: mailOptions.to,
						from: mailOptions.from,
						subject: mailOptions.subject,
						html: mailOptions.html
					}, (error, info) => {
						if (error) {
							console.error(error);
							resolve(error.message);
						}
						else {
							console.info('Email sent: ', JSON.stringify(info, null, 2));
							resolve(true);
						}
					});
				}
			}
			catch (e) {
				console.error(e);
				reject(e);
			}
		});
	}
	catch (e) {
		console.error(e);
	}
};

module.exports = sendEmail;

// sendEmail({
// 	from: 'support@girikon.ai',
// 	to: 'arunbaiswal@gmail.com',
// 	subject: `Your subject`,
// 	body: `<h1>Arun</h1>`
// }).then(r => console.log(r)).catch(e => console.error(e));