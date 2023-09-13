require("dotenv/config");
import express from "express";
import cors from "cors";
import routes from "./routes";
import "moment/locale/pt-br";
require("./database");
//teste

const PORT = 8080;
// const HOST = "localhost";
const HOST = "0.0.0.0";
// const HOST = "104.131.163.240";
  
const app = express();
app.use(express.raw({ type: 'application/json' }));//Json
app.use(cors());
app.use(express.json());
app.use(routes);
app.listen(PORT, HOST);
app.get('/', function(req, res, next) {
    res.send("Olá!");
}); 