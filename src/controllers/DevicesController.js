import moment from "moment-timezone";
import Devices from "../models/Devices";
import Generation from "../models/Generation";
import { Op } from "sequelize";
import Users from "../models/Users";
class DevicesController {
  //Esta função index processa dados de dispositivos, recuperando informações de gerações associadas a eles.
  //Ela inclui a ordenação por data e trata casos onde a geração atual não está disponível, utilizando dados da geração anterior.
  async index(req, res) {
    
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
  async bigNumberSum(req, res) {
    try {
      const { use_uuid } = req.body;
      const currentDate = new Date();

      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const result = await Generation.findAll({
        include: [
          {
            association: "devices",
            where: {
              // sta_uuid: "b5f9a5f7-2f67-4ff2-8645-47f55d265e4e",
              [Op.or]: [
                { dev_deleted: false },
                { dev_deleted: { [Op.is]: null } }
              ]
            },
            include: [
              {
                association: "brand_login",
                where: {
                  use_uuid: use_uuid,
                },
              },
            ],
          },
        ],
        where: {
          gen_date: {
            [Op.between]: [firstDayOfMonth, lastDayOfMonth],
          },
        },
        attributes: ["gen_date", "gen_real", "gen_estimated"],
      });
      
      const somaGenRealDia = {};
      const somaGenEstimadaDia = {};

      result.forEach((item) => {
        const dateKey = item.gen_date.split("T")[0];
        // Verifique se a geração real é maior que 0 antes de adicionar à soma
        if (item.gen_real > 0) {
          somaGenRealDia[dateKey] =
            (somaGenRealDia[dateKey] || 0) + item.gen_real;
          somaGenEstimadaDia[dateKey] =
            (somaGenEstimadaDia[dateKey] || 0) + item.gen_estimated;
        }
      });

      for (
        let date = new Date(firstDayOfMonth);
        date <= lastDayOfMonth;
        date.setDate(date.getDate() + 1)
      ) {
        const dateKey = date.toISOString().split("T")[0];
        somaGenRealDia[dateKey] = parseFloat(
          (somaGenRealDia[dateKey] || 0).toFixed(2)
        );
        somaGenEstimadaDia[dateKey] = parseFloat(
          (somaGenEstimadaDia[dateKey] || 0).toFixed(2)
        );
      }

      return res.status(200).json({
        message: "Somas calculadas com sucesso!",
        somaPorDiaReal: somaGenRealDia,
        somaPorDiaEstimada: somaGenEstimadaDia,
      
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Esta API calcula a soma diária de gerações real e estimada para um intervalo de datas específico, considerando apenas dispositivos associados a um usuário. 
  //Retorna as somas calculadas como resposta. Em caso de sucesso, a mensagem indica o cálculo bem-sucedido; em caso de erro, uma mensagem de falha é retornada.
  async sumGeneration(req, res) {
    try {
      const { startDate, endDate, use_uuid } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);

      const result = await Generation.findAll({
        include: [
          {
            association: "devices",
            where: {
              // sta_uuid: "b5f9a5f7-2f67-4ff2-8645-47f55d265e4e",
              [Op.or]: [
                { dev_deleted: false },
                { dev_deleted: { [Op.is]: null } }
              ]
            },
            include: [
              {
                association: "brand_login",
                where: {
                  use_uuid: use_uuid,
                },
              },
            ],
          },
        ],
        where: {
          gen_date: {
            [Op.between]: [start, end],
          },
        },
        attributes: ["gen_date", "gen_real", "gen_estimated"],
      });
      
      const somaGenRealDia = {};
      const somaGenEstimadaDia = {};

      result.forEach((item) => {
        const dateKey = item.gen_date.split("T")[0];
        // Verifique se a geração real é maior que 0 antes de adicionar à soma
        if (item.gen_real > 0) {
          somaGenRealDia[dateKey] =
            (somaGenRealDia[dateKey] || 0) + item.gen_real;
          somaGenEstimadaDia[dateKey] =
            (somaGenEstimadaDia[dateKey] || 0) + item.gen_estimated;
        }
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
        somaGenEstimadaDia[dateKey] = parseFloat(
          (somaGenEstimadaDia[dateKey] || 0).toFixed(2)
        );
      }

      return res.status(200).json({
        message: "Somas calculadas com sucesso!",
        somaPorDiaReal: somaGenRealDia,
        somaPorDiaEstimada: somaGenEstimadaDia,
      
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new DevicesController();
