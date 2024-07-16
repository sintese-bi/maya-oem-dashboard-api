import { Op } from "sequelize";
import Generation from "../models/Generation";
const currentDate = new Date();

// Ajustar as datas para UTC
const firstDayOfMonth = new Date(
  Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
);
const lastDayOfMonth = new Date(
  Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 0)
);
const firstDayOfYear = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
const lastDayOfMonthEnd = new Date(
  Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth() + 1,
    0,
    23,
    59,
    59,
    999
  )
);
export async function getGeneration(use_uuid) {
  return await Generation.findAll({
    include: [
      {
        association: "devices",
        attributes: ["dev_capacity", "dev_name", "dev_email", "dev_deleted"],
        where: {
          dev_email: { [Op.not]: null },
          [Op.or]: [{ dev_deleted: false }, { dev_deleted: { [Op.is]: null } }],
        },
        include: [
          {
            association: "brand_login",
            attributes: [],
            where: { use_uuid: use_uuid },
          },
        ],
      },
    ],
    attributes: ["gen_real", "gen_estimated", "gen_date", "dev_uuid"],
    where: {
      gen_date: { [Op.between]: [firstDayOfYear, lastDayOfMonthEnd] },
      gen_updated_at: {
        [Op.in]: Generation.sequelize.literal(`
          (SELECT MAX(gen_updated_at)
          FROM generation
          WHERE gen_date BETWEEN :firstDayOfYear AND :lastDayOfMonth
          GROUP BY gen_date, dev_uuid)
        `),
      },
    },
    replacements: { firstDayOfYear, lastDayOfMonth },
  });
}
