import moment from "moment-timezone";
import Devices from "../models/Devices";
import Generation from "../models/Generation";
import { Op } from "sequelize";
class DevicesController {
  //Esta função index processa dados de dispositivos, recuperando informações de gerações associadas a eles.
  //Ela inclui a ordenação por data e trata casos onde a geração atual não está disponível, utilizando dados da geração anterior.
  async index(req, res) {
    // const { brand } = req.query;
    const blUuid = req.params.bl_uuid;
    const pl_name = req.params;
    const date = new Date();
    const currentDate = moment(date).format("YYYY-MM-DD");
    const previousDate = moment(date).subtract(1, "days").format("YYYY-MM-DD");

    try {
      const data = await Devices.findAll({
        include: { association: "generation", order: ["gen_date"] },
        where: { bl_uuid: blUuid },

        order: ["dev_name"],
      }).then(async (result) => {
        result.forEach((r) => {
          const generation = r.dataValues.generation.find(
            (gen) => gen.gen_date === currentDate
          );
          const previousGeneration = r.dataValues.generation.find(
            (gen) => gen.gen_date === previousDate
          );

          const gen_estimated = r.dataValues.generation[0]?.gen_estimated;

          r.dataValues.generation = generation;

          if (!generation) {
            r.dataValues.generation = {
              gen_estimated: gen_estimated ? gen_estimated : 0,
              gen_real: previousGeneration ? previousGeneration.gen_real : 0,
            };
          }
        });

        return result;
      });

      return res.json(data);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Esta função calcula a soma da geração real e estimada em um intervalo de datas especificado.
  //Para cada dia dentro do intervalo, ela busca e soma as gerações correspondentes de todas as usinas. Os resultados são retornados em formato JSON, incluindo as somas por dia tanto para a geração real quanto para a estimada. Em caso de erro, uma mensagem de erro é retornada com o status 400.
  async sumGeneration(req, res) {
    try {
      const { startDate, endDate } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);

      const result = await Generation.findAll({
        where: {
          gen_date: {
            [Op.between]: [start, end],
          },
        },
        attributes: ["gen_date", "gen_real"],
      });

      const somaGenRealDia = {};
      

      result.forEach((item) => {
        const dateKey = item.gen_date.split("T")[0];

        somaGenRealDia[dateKey] =
          (somaGenRealDia[dateKey] || 0) + item.gen_real;
      });

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dateKey = date.toISOString().split("T")[0];
        somaGenRealDia[dateKey] = parseFloat(
          (somaGenRealDia[dateKey] || 0).toFixed(2)
        );
      }

      return res.status(200).json({
        message: "Somas calculadas com sucesso!",
        somaPorDiaReal: somaGenRealDia,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new DevicesController();
