import { Stripe } from "stripe";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import Users from "../models/Users";
import { raw } from "express";
const stripe = new Stripe("", {
  apiVersion: "2020-08-27",
});

//Configuração das credenciais do email de envio
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,

  secure: true, //alterar
  auth: {
    user: "noreplymayawatch@gmail.com",
    pass: "",
  },
  tls: {
    rejectUnauthorized: true, //Usar "false" para ambiente de desenvolvimento
  },
});

class StripeController {
  //Esta API trata webhooks do Stripe para processar pagamentos bem-sucedidos. Ao receber um evento de pagamento confirmado, ela atualiza o tipo de plano e status de membro de um usuário no banco de dados.
  //Em seguida, envia um e-mail de confirmação de compra ao cliente, com informações relevantes sobre a transação.
  async handleStripeWebhook(req, res) {
    const signature = req.headers["stripe-signature"];
    // const endpointSecret =
    //   "whsec_0ccb03f631e449edeb33ee5f277b665a47fadb48612dd0080dd31143e8b2dd64";
    let event;

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
        const customerEmail = paymentIntentSucceeded.receipt_email;
        const amount = paymentIntentSucceeded.amount / 100;
        let type_plan;
        if (amount == 239.0) {
          type_plan = "1";
        } else if (amount == 459.0) {
          type_plan = "2";
        } else if (amount == 629.0) {
          type_plan = "3";
        } else if (amount == 99.0) {
          type_plan = "4";
        } else {
          type_plan = "0";
        }
        try {
          await Users.update(
            {
              use_type_plan: type_plan,
              use_type_member: true,
            },
            {
              where: { use_email: customerEmail },
            }
          );
        } catch (error) {
          console.error("Error updating phone_number:", error);
        }
        const emailBody = `
        <p>Olá,</p>
                
        <p>Estamos animados em tê-lo conosco na MAYA WATCH! Seu pagamento foi efetuado com sucesso!</p>
                        
        <p>Você pode conferir todas as funcionalidades e aprender a utilizar nosso dashboard através do contato (31) 9 8234-1415.</p>
                            
        <p>A Nota Fiscal de sua compra será emitida e enviada para o e-mail informado no cadastro. Se houver qualquer necessidade de alteração nos dados informados, por favor, não hesite em nos contactar para atualização pelo e-mail suportemayawatch@gmail.com.</p>
                        
        <p>Se você tiver alguma dúvida ou precisar de suporte adicional, estamos à sua disposição. Sua satisfação e sucesso são nossas principais prioridades!</p>
                        
        <p>Agradecemos pela confiança em nossos serviços.</p>
                        
        <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
        <p><img src="" alt="Logo da MAYA WATCH"></p>
        
                    `;
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const mailOptions = {
          from: '"noreplymayawatch@gmail.com',
          to: customerEmail,
          subject: "Confirmação de Compra",
          text: "",
          html: emailBody,
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
