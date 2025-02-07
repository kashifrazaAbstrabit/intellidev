import nodeMailer from "nodemailer";

interface Options {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: Options): Promise<void> => {
  try {
    const transporter = nodeMailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions: nodeMailer.SendMailOptions = {
      from: process.env.SMTP_EMAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    if (!mailOptions.to) {
      throw new Error("Recipient's email address is missing");
    }

    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};
