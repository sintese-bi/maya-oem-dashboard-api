import moment from "moment-timezone";
import Devices from "../models/Devices";
import Generation from "../models/Generation";

class DevicesController {
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
  async sumGeneration(req, res) {
    try {
        const { startDate, endDate } = req.body;
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        let somaGenRealDia = {};

        while (currentDate <= end) {
            const result = await Generation.findAll({
                where: { gen_date: currentDate },
                attributes: ["gen_real"],
            });

            const somaGenReal = result.reduce((acumulador, item) => {
                return acumulador + item.gen_real;
            }, 0);

            somaGenRealDia[currentDate.toISOString().split("T")[0]] = parseFloat(somaGenReal.toFixed(2));

            console.log(
                `Soma de gen_real para ${
                currentDate.toISOString().split("T")[0]
                }: ${somaGenRealDia[currentDate.toISOString().split("T")[0]]}`
            );

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return res.status(200).json({
            message: "Somas calculadas com sucesso!",
            somaPorDia: somaGenRealDia,
        });
    } catch (error) {
        return res
            .status(400)
            .json({ message: `Erro ao retornar os dados. ${error}` });
    }
}

}

export default new DevicesController();
