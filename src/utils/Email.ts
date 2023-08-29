import nodemailer from 'nodemailer';
import pug from 'pug';
import { convert } from 'html-to-text';
import { envVars } from '../configs/env.config';

const smtpTransport = {
  host: envVars.EMAIL_HOST,
  port: envVars.EMAIL_PORT,
  auth: {
    user: envVars.EMAIL_USER,
    pass: envVars.EMAIL_PASS,
  },
};

export default class Email {
  private firstName: string;
  private to: string;
  private from: string;

  constructor(
    private user: { fullName: string; email: string },
    private url: string
  ) {
    this.firstName = user.fullName.split(' ')[0];
    this.to = user.email;
    this.from = envVars.EMAIL_FROM;
  }

  private newTransport() {
    return nodemailer.createTransport(smtpTransport);
  }

  private async send(template: string, subject: string) {
    const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
      firstName: this.firstName,
      subject,
      url: this.url,
    });
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: convert(html),
      html,
    };

    const info = await this.newTransport().sendMail(mailOptions);
    console.log(nodemailer.getTestMessageUrl(info));
  }

  async sendVerificationCode() {
    await this.send(
      'verificationEmailTemplate',
      'Your account verification code'
    );
  }
}
