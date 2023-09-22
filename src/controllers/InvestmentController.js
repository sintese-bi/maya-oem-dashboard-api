import { Sequelize, Op } from "sequelize";
import Devices from "../models/Devices";
import moment from "moment-timezone";

class InvestmentController {
  //Esta função assíncrona recupera os dados de geração de energia associados a um dispositivo específico identificado pelo devUuid. 
  //Em seguida, os dados são ordenados por data e retornados em formato JSON como resposta. Em caso de erro, uma mensagem de erro é retornada no formato JSON.
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
