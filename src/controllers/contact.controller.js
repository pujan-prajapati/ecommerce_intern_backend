import { Contact } from "../models/contact.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { sendEmail } from "../utils/sendMail.js";

//send message
export const sendMessage = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { fullName, email, phone, message } = req.body;

  const findUser = await User.findById(_id);
  if (!findUser) {
    throw new Error("User not found");
  }

  // Save the contact form data in the database
  const newContact = new Contact({ fullName, email, phone, message });
  await newContact.save();

  // Prepare the email details
  const subject = `New Contact Form Submission from ${findUser.firstName + " " + findUser.lastName}`;
  const text = `You have a new contact form submission:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`;
  const html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `;

  // Send the email to the designated notification email
  await sendEmail(
    findUser.email, // Sender's email address
    process.env.EMAIL_USER, // Recipient's email address
    subject,
    text,
    html
  );

  res.status(200).json({ message: "Contact form submitted successfully." });
});
