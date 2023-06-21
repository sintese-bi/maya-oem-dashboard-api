import moment from "moment-timezone";
import Devices from "../models/Devices";

class DevicesControlle {
  // retorna dados para grafico de registro

  async index(req, res) {
    const { brand } = req.query;
    const blUuid = req.params.bl_uuid;

    const date = new Date()
    const dateNow = moment(date).format('YYYY-MM-DD');
    console.log("dateNow ", dateNow)

    try {
      
      const data = await Devices.findAll({
        include: { association: "generation", order: ['gen_date'] },
        where: { bl_uuid: blUuid },
        order: ['dev_name'],

      }).then(async (result) => {

        result.forEach((r) => {

          const generation = r.dataValues.generation.find((gen) => gen.gen_date === dateNow);
          console.log("generation  ",r.dataValues.generation)
          const gen_estimated = r.dataValues.generation[0]?.gen_estimated

          r.dataValues.generation = generation

          // VERIFICANDO SE TEM GERAÇÃO HOJE 
          if (!generation) {
            r.dataValues.generation = {
              gen_estimated: gen_estimated ? gen_estimated : 0,
              gen_real: 0,
            };
          }
        });

        return result;
      });

      return res.json(data);
    } catch (error) {
      return res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

}

export default new DevicesControlle();
