import nodemailer from "nodemailer";

const email = "mrudulpatel0401@gmail.com";
const pass = "zdxiecdcinoafwaj";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass,
  },
});
