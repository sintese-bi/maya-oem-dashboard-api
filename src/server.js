//Este código configura e inicia um servidor Express.
//Além disso, o servidor escuta na porta 8080 e no endereço "0.0.0.0". A rota inicial ('/') responde com uma mensagem "Olá!" quando acessada via método GET.
//Há também um middleware específico para tratar requisições na rota '/v1/stripe-webhook' como dados brutos no formato JSON.
require("dotenv/config");
import express from "express";
import cors from "cors";
import routes from "./routes";
import "moment/locale/pt-br";
import "./massive-email/verifiy_massive_emails.js";
require("./database");

const PORT = 8080;
const HOST = "localhost";
//const HOST = "0.0.0.0";
// const HOST = "104.131.163.240";

const app = express();

// Middleware para tratar como Buffer Bruto apenas em uma rota específica
app.use((req, res, next) => {
  if (req.path === "/v1/stripe-webhook") {
    express.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json({ limit: "300mb", extended: true })(req, res, next);
  }
});

const corsOptions = {
  origin: "http://localhost:3000",
};
app.use(cors(corsOptions));
app.use(routes);

app.listen(PORT, HOST);
app.get("/", function (req, res, next) {
  res.send("Olá!");
});
