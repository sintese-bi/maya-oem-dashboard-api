import { Sequelize, Op } from "sequelize";
import Devices from "../models/Devices";
import moment from "moment-timezone";

class InvestmentController {
  // retorna dados para grafico de registro
  async index(req, res) {
    const { devUuid } = req.query;

    try {
      const data = await Devices.findAll({
        include: {
          association: "generation",
          order: ["gen_date"],
        },
        where: {
          dev_uuid: devUuid,
        },
      });

      return res.json(data);
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new InvestmentController();
