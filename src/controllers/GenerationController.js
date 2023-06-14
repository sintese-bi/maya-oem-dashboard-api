import { Sequelize, Op } from "sequelize";
import Devices from "../models/Devices";
import Generation from "../models/Generation";
import moment from "moment-timezone";
import Alerts from "../models/Alerts";
import Brand from "../models/Brand";
import Temperature from "../models/Temperature";

class GenerationController {
  // retorna dados para gráfico de registro
  async deviceDataAndLatestTemperature(req, res) {
    const { date, blUuid, type, devUuid } = req.query;
    const dataNow = moment(date).format("YYYY-MM-DD");
    const month = moment(date).get("month") + 1;
    const year = moment(date).get("year");

    const deviceFilterOptions = devUuid
      ? {
          dev_uuid: devUuid,
        }
      : {};
    const brandFilterOptions = blUuid
      ? {
          bl_uuid: blUuid,
        }
      : {};

    try {
      const deviceData = await Devices.findAll({
        where: {
          ...deviceFilterOptions,
        },
        attributes: ["dev_name"],
        include: [
          {
            model: Generation,
            as: "generation",
            where: {
              [Op.and]:
                type === "month"
                  ? [
                      Sequelize.fn('EXTRACT(MONTH from "gen_date") =', month),
                      Sequelize.fn('EXTRACT(YEAR from "gen_date") =', year),
                    ]
                  : [Sequelize.fn('EXTRACT(YEAR from "gen_date") =', year)],
            },
            order: ["gen_date"],
          },
        ],
      });

      const latestTemp = await Devices.findAll({
        where: {
          ...deviceFilterOptions,
          ...brandFilterOptions,
        },
        attributes: ["dev_name"],
        include: [
          {
            model: Brand,
            as: "brand",
            attributes: [],
          },
          {
            model: Temperature,
            as: "temperature",
            attributes: ["temp_temperature"],
            order: [["temp_created_at", "DESC"]],
            limit: 1,
          },
        ],
      });

      deviceData.forEach((dev) => {
        const generation = dev.generation.find(
          (gen) => gen.gen_date === dataNow
        );

        dev.alert = {
          msg: "Geração diária dentro da faixa estimada",
          type: "success",
        };

        if (generation) {
          const alert = (generation.gen_real / generation.gen_estimated) * 100;

          if (alert < 20) {
            dev.alert = {
              msg: `Geração diária ${alert.toFixed(2)}% da estimada`,
              type: "warning",
            };
          }
        }
      });

      res.json({ deviceData, latestTemp });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async recentAlerts(req, res) {
    const { blUuid } = req.query;

    const brandFilterOptions = blUuid
      ? {
          bl_uuid: blUuid,
        }
      : {};

    try {
      const recentAlerts = await Devices.findAll({
        where: {
          ...brandFilterOptions,
        },
        attributes: ["dev_name"],

        include: [
          {
            model: Brand,
            as: "brand", // incluir a associação com a tabela Brand
            attributes: [],
          },
          {
            model: Alerts,
            as: "alerts",
            attributes: ["al_alerts", "al_inv"],
            order: [["alert_created_at", "DESC"]],
            where: {
              alert_created_at: {
                [Op.between]: [
                  moment().subtract(1, "hour").toDate(),
                  moment().toDate(),
                ],
              },
            },
          },
        ],
      });

      res.json({ recentAlerts });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  // SALVANDO DADOS DE GERAÇÃO ESTIMADA E PORCENTAGEM
  async projectionPatch(req, res) {
    try {
      const { percentMaxMin, value, date, devUuid } = req.body;
      const year = moment(value[0].gen_date).get("year");

      await Generation.findAll({
        where: {
          [Op.and]: Sequelize.fn('EXTRACT(YEAR from "gen_date") =', year),
          [Op.or]: value.map((month) =>
            Sequelize.fn(
              'EXTRACT(MONTH from "gen_date") =',
              moment(month.gen_date).get("month") + 1
            )
          ),
          dev_uuid: devUuid,
        },
      }).then(async (result) => {
        result.forEach(async (item) => {
          const gen_uuid = item.dataValues.gen_uuid;
          const gen_date = item.dataValues.gen_date;
          const month = Number(
            moment(item.dataValues.gen_date).get("month") + 1
          );

          const projection = value.filter(
            (A) => Number(moment(A.gen_date).get("month") + 1) === month
          )[0];
          const gen_estimated =
            projection.gen_projection / moment(gen_date).daysInMonth();

          await Generation.update(
            {
              gen_projection: projection.gen_projection,
              gen_percentage: percentMaxMin,
              gen_estimated: gen_estimated,
            },
            {
              where: { gen_uuid: gen_uuid },
            }
          );
        });

        return result;
      });
      return res.json({ message: "Projeção definida com sucesso!" });
    } catch (error) {
      res.status(400).json({ message: `Erro ao definir projeção!` });
    }
  }

  async projection(req, res) {
    const { date, devUuid } = req.query;

    const year = moment(date).get("year");

    try {
      const data = await Generation.findAll({
        attributes: ["gen_projection", "gen_date", "gen_percentage"],

        order: ["gen_date"],
        where: {
          [Op.and]: Sequelize.fn('EXTRACT(YEAR from "gen_date") =', year),
          dev_uuid: devUuid,
        },
      }).then(async (result) => {
        const distinctYear = result.filter(function (item) {
          return (
            !this[
              JSON.stringify(moment(item.dataValues.gen_date).get("month") + 1)
            ] &&
            (this[
              JSON.stringify(moment(item.dataValues.gen_date).get("month") + 1)
            ] = true)
          );
        }, Object.create(null));

        return distinctYear;
      });

      return res.json(data);
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new GenerationController();
