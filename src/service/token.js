require("dotenv").config();
import jwt from "jsonwebtoken";

export const checkToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Acesso negado!" });

  try {
    const secret = process.env.SECRET;
    jwt.verify(token, secret);

    next();
  } catch (err) {
    res.status(401).json({ message: "O Token é inválido!" });
  }
};

export default checkToken;