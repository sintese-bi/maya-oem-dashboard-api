import { Stripe } from "stripe";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import Users from "../models/Users";
import { raw } from "express";
const stripe = new Stripe(
  "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",
  {
    apiVersion: "2020-08-27",
  }
);
// const endpointSecret = "whsec_mwlESrCsoejpTKVW4xjkjKOAhHplrmaZ";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,

  secure: false, //alterar
  auth: {
    user: "noreplymayawatch@gmail.com",
    pass: "xbox ejjd wokp ystv",
  },
  tls: {
    rejectUnauthorized: false, //Usar "false" para ambiente de desenvolvimento
  },
});

class StripeController {
  async handleStripeWebhook(req, res) {
    const signature = req.headers["stripe-signature"];
    const endpointSecret =
      "whsec_0ccb03f631e449edeb33ee5f277b665a47fadb48612dd0080dd31143e8b2dd64";
    let event;
    console.log(req.body);
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    switch (event.type) {
      //   case "checkout.session.completed":
      //     const checkoutSessionCompleted = event.data.object;
      //     const phone_number = checkoutSessionCompleted.phone;
      //     break;
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        try {
          await Users.update(
            {
              use_telephone: "123456789",
            },
            {
              where: { use_email: "eloymjunior00@gmail.com" },
            }
          );
        } catch (error) {
          console.error("Error updating phone_number:", error);
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const mailOptions = {
          from: '"noreplymayawatch@gmail.com',
          to: "eloymjunior00@gmail.com",
          subject: "Hello ✔",
          text: "Hello world?",
          html: "<b>Hello world?</b>",
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Erro ao enviar o e-mail:", error);
          } else {
            console.log("E-mail enviado:", info.res);
          }
        });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.send();
  }
}

export default new StripeController();
