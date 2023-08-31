import moment from "moment-timezone";
import Devices from "../models/Devices";

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
  },
}

export default new DevicesController();
