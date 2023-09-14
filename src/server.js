require("dotenv/config");
import express from "express";
import cors from "cors";
import routes from "./routes";
import "moment/locale/pt-br";
require("./database");

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

// Middleware para tratar como Buffer Bruto apenas em uma rota específica
app.use((req, res, next) => {
  if (req.path === '/v1/stripe-webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors());
app.use(routes);

app.listen(PORT, HOST);

app.get('/', function(req, res, next) {
    res.send("Olá!");
});
