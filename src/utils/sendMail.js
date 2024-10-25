import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "myrna.howe97@ethereal.email",
        pass: "Dwh5ng9MaESWvmKUUB",
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent : ${info.response}`);

    return info;
  } catch (error) {
    console.log(`Error while sending mail : ${error}`);
    throw new Error(`Error while sending mail : ${error}`);
  }
};
