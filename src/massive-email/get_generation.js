import { Op } from "sequelize";
import Generation from "../models/Generation";
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
export async function getGeneration(use_uuid) {
  return await Generation.findAll({
    include: [
      {
        association: "devices",
        attributes: ["dev_capacity", "dev_name", "dev_email", "dev_deleted"],
        where: {
          dev_email: {
            [Op.not]: null,
          },
          [Op.or]: [{ dev_deleted: false }, { dev_deleted: { [Op.is]: null } }],
        },
        include: [
          {
            association: "brand_login",
            attributes: [],
            where: {
              use_uuid: use_uuid,
            },
          },
        ],
      },
    ],
    attributes: ["gen_real", "gen_estimated", "gen_date", "dev_uuid"],
    where: {
      gen_date: {
        [Op.between]: [firstDayOfMonth, lastDayOfMonth],
      },
      gen_updated_at: {
        [Op.in]: Generation.sequelize.literal(`
                        (SELECT MAX(gen_updated_at) 
                        FROM generation 
                        WHERE gen_date BETWEEN :firstDayOfMonth AND :lastDayOfMonth 
                        GROUP BY gen_date, dev_uuid)
                      `),
      },
    },
    replacements: { firstDayOfMonth, lastDayOfMonth },
  });
}
