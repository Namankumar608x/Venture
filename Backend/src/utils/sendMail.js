import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail(email, otp) {
  try {
    const response = await resend.emails.send({
      from: "Auth <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<h1>${otp}</h1>`,
    });

    console.log("RESEND RESPONSE:", response);
  } catch (err) {
    console.error("RESEND ERROR FULL:", err);
    throw err;
  }
}
