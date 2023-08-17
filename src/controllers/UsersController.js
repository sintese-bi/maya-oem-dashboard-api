//Pensar em uma maneira de criptografar as requests

import bcrypt from "bcrypt";
import fs from "fs";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import { Op } from "sequelize";
import Brand from "../models/Brand";
import IrradiationCoefficient from "../models/IrradiationCoefficient";
import ProfileLevel from "../models/ProfileLevel";
import Users from "../models/Users";
import Generation from "../models/Generation";
import Devices from "../models/Devices";
import Proposal from "../models/Proposal";
require("dotenv").config();
const googleKeyJson = fs.readFileSync("./googlekey.json", "utf8");
class UsersController {
  //API para mostrar nome e usuário
  async show(req, res) {
    try {
      const use_uuid = req.params.uuid;

      const user = await Users.findByPk(use_uuid, {
        attributes: ["use_name", "use_email"],
      });

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado!" });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async store(req, res) {
    try {
      const {
        nome_completo,
        email,
        password,
        confirmPassword,
        quantidade_inversores,
        inversores,
      } = req.body;
      const existingEmail = await Users.findOne({
        attributes: ["use_email"],
        where: { use_email: email },
      });
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "O email não é válido." });
      }
      if (existingEmail) {
        return res.status(400).json({ message: "O email já está em uso." });
      }
      if (password.length < 4) {
        return res
          .status(400)
          .json({ message: "A senha precisa ter 4 ou mais caracteres!" });
      }
      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "A senha e a confirmação precisam ser iguais." });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criação do novo usuário na tabela Users
      const newUser = await Users.create({
        use_name: nome_completo,
        pl_uuid: "2e317d3d-8424-40ca-9e29-665116635eec",
        use_module_numbers: quantidade_inversores,
        use_email: email,
        use_password: passwordHash,
      });
      let brandUuids = []; // Array para armazenar os bl_uuids

      for (const inversor of inversores) {
        const newBrand = await Brand.create({
          use_uuid: newUser.use_uuid,
          bl_name: "teste",
          bl_login: inversor.login,
          bl_password: inversor.senha,
        });

        brandUuids.push({
          bl_uuid: newBrand.bl_uuid,
          marca: inversor.marca,
        }); // Armazena cada bl_uuid e marca no array
      }

      // Agora, criar os registros na tabela "devices" com os bl_uuids e marcas armazenados
      for (const item of brandUuids) {
        await Devices.create({
          bl_uuid: item.bl_uuid,
          dev_brand: item.marca.toLowerCase(),
        });
      }

      return res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Erro ao criar o usuário: ${error.message}` });
    }
  }

  async login(req, res) {
    //O cliente logará com email e senha nessa API de login.
    try {
      const { use_email, use_password } = req.body;
      console.log("req ", req);

      const result = await Users.findOne({
        attributes: ["use_uuid", "use_name", "use_password"],
        where: { use_email: use_email },
        include: [
          {
            attributes: ["pl_cod"],
            association: "profile_level",
          },
        ],
      });

      const checkPassword = await bcrypt.compare(
        use_password,
        result.use_password
      );

      if (!checkPassword) {
        return res.status(404).json({ message: "Senha inválida" });
      }
      const without_password = result.get({ plain: true });
      delete without_password.use_password;
      //Construindo o token que o cliente receberá
      const secret = process.env.SECRET;
      const token = jwt.sign(
        {
          id: result._id,
        },
        secret
      );

      return res
        .status(200)
        .json({ message: "Autenticado!", token, result: without_password }); //remove o use_password no retorno do json
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async users(req, res) {
    try {
      const result = await Users.findAll({
        attributes: ["use_name", "use_email", "use_uuid"],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_uuid", "bl_name"],
          },
          {
            association: "profile_level",
            attributes: ["pl_cod", "pl_name"],
          },
        ],
      });
      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async userBrands(req, res) {
    try {
      const use = req.params.uuid;

      const result = await Users.findByPk(use, {
        attributes: ["use_name"],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_name", "bl_uuid"],
            include: [
              {
                association: "devices",
                attributes: ["dev_uuid", "dev_name", "dev_brand"],
                include: [
                  {
                    association: "generation",
                    attributes: ["gen_real"],
                    order: [["gen_updated_at", "DESC"]],
                    limit: 1,
                  },
                  {
                    association: "temperature",
                    attributes: ["temp_temperature"],
                    order: [["temp_created_at", "DESC"]],
                    limit: 1,
                  },
                  {
                    association: "alerts",
                    attributes: ["al_alerts", "al_inv"],
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
              },
            ],
          },
        ],
      });
      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async kanban(req, res) {
    try {
      const result = await Users.findAll({
        attributes: [
          "use_name",
          "use_email",
          "use_city",
          "use_city",
          "use_installation_address",
          "use_cep",
          "use_kwp",
          "use_type_system",
          "use_type_system",
          "use_module_numbers",
          "tp_uuid",
          "use_cnhrg",
          "use_proof",
        ],
        include: [
          {
            attributes: ["tp_name"],
            association: "type_plans",
          },
        ],
      });
      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async generationReport(req, res) {
    try {
      const result = await Users.findAll({
        attributes: ["use_name", "use_email"],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_name"],
            include: [
              {
                association: "devices",
                attributes: ["dev_name"],
                include: [
                  {
                    association: "generation",
                    attributes: [
                      "gen_real",
                      "gen_estimated",
                      "gen_date",
                      // "gen_percentage",
                    ],
                    where: {
                      gen_date: {
                        [Op.gt]: moment(moment())
                          .subtract(1, "months")
                          .endOf("month")
                          .format("YYYY-MM-DD"),
                      },
                    },
                  },
                  {
                    association: "temperature",
                    attributes: ["temp_temperature"],
                  },
                  {
                    association: "alerts",
                    attributes: ["al_alerts", "al_inv"],
                  },
                ],
              },
            ],
          },
        ],
      });

      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }

  async patchAlertFrequency(req, res) {
    const { useUuid, values } = req.body;
    const { percentage, frequencyName } = values;

    await Users.update(
      { use_percentage: percentage, use_frequency_name: frequencyName },
      { where: { use_uuid: useUuid } }
    );

    try {
      return res.status(200).json({ message: "Alterar salva com sucesso!" });
    } catch (error) {
      return res.status(400).json({ message: "Erro ao salvar os dados!" });
    }
  }

  async alertFrequency(req, res) {
    const use = req.params.uuid;
    const result = await Users.findByPk(use, {
      attributes: ["use_percentage", "use_frequency_name"],
    });

    try {
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: "Erro ao restornar os dados!" });
    }
  }

  async dashboard(req, res) {
    try {
      const use = req.params.uuid;

      const startOfMonth = moment().startOf("month").toDate();
      const endOfMonth = moment().endOf("month").toDate();

      const result = await Users.findByPk(use, {
        attributes: ["use_name"],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_name", "bl_uuid"],
            include: [
              {
                association: "devices",
                attributes: ["dev_uuid", "dev_name", "dev_brand"],
                include: [
                  {
                    association: "generation",
                    attributes: ["gen_real", "gen_estimated", "gen_date"],
                    where: {
                      gen_date: {
                        [Op.between]: [startOfMonth, endOfMonth],
                      },
                    },
                    order: [["gen_date", "DESC"]],
                  },
                  {
                    association: "alerts",
                    attributes: ["al_alerts", "al_inv", "alert_created_at"],
                  },
                  {
                    association: "status",
                    attributes: ["sta_code", "sta_name"],
                  },
                ],
              },
            ],
          },
        ],
      });

      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //localhost:8080/v1/irrcoef/SERGIPE/Areia%20Branca?potSistema=30
  async irradiation(req, res) {
    try {
      const { ic_states, ic_city, devUuid } = req.params;
      const potSistema = parseFloat(req.query.potSistema);
      const name = req.query.name;

      const meses = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];

      const irradiationData = {};

      for (const mes of meses) {
        const attribute = `ic_${mes}`;

        const result = await IrradiationCoefficient.findOne({
          where: { ic_states, ic_city },
          attributes: [attribute],
        });

        if (!result) {
          return res.status(404).json({ message: "Não encontrado!" });
        }

        const irr = result.get(attribute);
        const gen_estimated = irr * potSistema * 0.85;
        const gen_estimated_2 = gen_estimated.toFixed(2);
        console.log(gen_estimated_2);
        irradiationData[mes] = parseFloat(gen_estimated_2);
      }

      // Busque todos os registros associados ao devUuid na tabela "generation"
      const generationsToUpdate = await Generation.findAll({
        where: { dev_uuid: devUuid },
      });
      // Busque o dispositivo associado ao devUuid na tabela "devices"
      const deviceToUpdate = await Devices.findOne({
        where: { dev_uuid: devUuid },
      });
      // Atualize o valor da coluna "gen_estimated" para cada dia do mês correspondente
      for (const generation of generationsToUpdate) {
        const month = meses[new Date(generation.gen_date).getMonth()];
        generation.gen_estimated = irradiationData[month];
        await generation.save();
      }

      deviceToUpdate.dev_contract_name = name;
      deviceToUpdate.dev_capacity = potSistema;
      deviceToUpdate.dev_address = ic_city;
      await deviceToUpdate.save();
      return res
        .status(200)
        .json({ message: "Registros atualizados com sucesso!" });
    } catch (error) {
      return res.status(400).json({ message: `Erro. ${error.message}` });
    }
  }
  async report(req, res) {
    try {
      const { blUuid } = req.params;
      const result = await Devices.findAll({
        where: { bl_uuid: blUuid },
        // include: [
        //   {
        //     model: Generation,
        //     attributes: ["coluna1", "coluna2"],
        //   },
        // ],
        attributes: ["dev_capacity"],
      });
      const sumOfDevCapacities = result.reduce(
        (accumulator, device) => accumulator + device.dev_capacity,
        0
      );
      return res.status(200).json({ sumOfDevCapacities });
    } catch (error) {
      return res.status(400).json({ message: `Erro. ${error.message}` });
    }
  }
  async reportClient(req, res) {
    try {
      const { devUuid } = req.params;
      //teste
      const result = await Devices.findOne({
        where: { dev_uuid: devUuid },
        // include: [
        //   {
        //     model: Users,
        //     attributes: ["use_email"],
        //   },
        // ],
        attributes: [
          "dev_capacity",
          "dev_contract_name",
          "dev_brand",
          "dev_address",
        ],
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ message: `Erro. ${error.message}` });
    }
  }
  async irradiation_2(req, res) {
    try {
      let { ic_city, ic_states } = req.params;
      ic_states = ic_states.toUpperCase();

      const resulta = await IrradiationCoefficient.findOne({
        where: { ic_city, ic_states },
        attributes: ["ic_yearly"],
      });
      console.log(resulta);
      return res.status(200).json(resulta);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}
export default new UsersController();
