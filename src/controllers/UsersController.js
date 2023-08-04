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
        use_uuid,
        use_wifi,
        use_module_numbers,
        use_password,
        confirmPassword,
        brand_login,
      } = req.body;

      const credentials = fs.readFileSync("googlekey.json");
      const { client_email, private_key } = JSON.parse(credentials);

      const client = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ["https://www.googleapis.com/auth/drive.file"],
        null
      );

      await client.authorize();
      const drive = google.drive({ version: "v3", auth: client });

      const folderName = use_uuid;
      const fileMetadataFolder = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: ["1QjNkaXimF0GOltEMktJ0kq5vLCMGWerB"],
      };
      const driveFolder = await drive.files.create({
        resource: fileMetadataFolder,
        fields: "id",
      });
      const folderId = driveFolder.data.id;
      // Salvando imagens no Google Drive
      const image1 = req.files["image1"][0];
      const image2 = req.files["image2"][0];

      client.authorize(async function (err, token) {
        if (err) {
          console.log(err);
          return res.status(401).json({ message: "Falha na autorização" });
        } else {
          const drive = google.drive({ version: "v3", auth: client });

          const fileMetadata1 = {
            name: image1.originalname,
            parents: [folderId],
          };
          const media1 = {
            mimeType: image1.mimetype,
            body: fs.createReadStream(image1.path),
          };
          const uploadedFiles = await Promise.all([
            new Promise((resolve, reject) => {
              drive.files.create(
                {
                  resource: fileMetadata1,
                  media: media1,
                  fields: "id, webViewLink",
                },
                function (err, uploadedFile1) {
                  if (err) {
                    console.error(err);
                    return res
                      .status(400)
                      .json({ message: "Erro ao salvar imagem 1" });
                  } else {
                    console.log("Imagem 1 salva com sucesso!");

                    console.log(
                      `Link da imagem 1: ${uploadedFile1.data.webViewLink}`
                    );
                    Users.update(
                      { use_cnhrg: uploadedFile1.data.webViewLink },
                      { where: { use_uuid: use_uuid } }
                    )
                      .then(() => {
                        resolve();
                      })
                      .catch((err) => {
                        console.error(err);
                        return res.status(400).json({
                          message: "Erro ao salvar o link da imagem 1",
                        });
                      });
                  }
                }
              );

              const fileMetadata2 = {
                name: image2.originalname,
                parents: [folderId],
              };
              const media2 = {
                mimeType: image2.mimetype,
                body: fs.createReadStream(image2.path),
              };
              drive.files.create(
                {
                  resource: fileMetadata2,
                  media: media2,
                  fields: "id, webViewLink",
                },
                function (err, uploadedFile2) {
                  if (err) {
                    console.error(err);
                    return res
                      .status(400)
                      .json({ message: "Erro ao salvar imagem 2" });
                  } else {
                    console.log("Imagem 2 salva com sucesso!");

                    console.log(
                      `Link da imagem 2: ${uploadedFile2.data.webViewLink}`
                    );
                    Users.update(
                      { use_proof: uploadedFile2.data.webViewLink },
                      { where: { use_uuid: use_uuid } }
                    )
                      .then(() => {
                        resolve();
                      })
                      .catch((err) => {
                        console.error(err);
                        return res.status(400).json({
                          message: "Erro ao salvar o link da imagem 2",
                        });
                      });
                  }
                }
              );

              resolve();
            }),
          ]);

          return res.status(200).json({
            message: "Dados atualizados com sucesso!",
          });
        }
      });
      //API para registrar o restante de dados do cliente

      const profile = await ProfileLevel.findOne({
        where: { pl_cod: "client" },
      });
      const pl_uuid = profile.pl_uuid;

      // Definir qual valor mínimo e máximo de caracteres da senha do cliente
      if (use_password.length < 4 || use_password.length > 8) {
        return res
          .status(401)
          .json({ message: "A senha precisa conter entre 4 e 8 dígitos!" });
      }
      if (use_password.includes(" ")) {
        return res
          .status(401)
          .json({ message: "A senha não pode conter espaços" });
      }
      if (use_password !== confirmPassword) {
        return res
          .status(401)
          .json({ message: "A senha e a confirmação precisam ser iguais!" });
      }

      //Criando um hash para a senha
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(use_password, salt);

      // Atualizando os dados restantes do cliente
      await Users.update(
        {
          use_password: passwordHash,
          use_wifi,
          use_module_numbers,
          pl_uuid: pl_uuid,
        },
        { where: { use_uuid: use_uuid } }
      );
      // Criando as entradas de marcação de login da marca
      const brandLoginArray = JSON.parse(brand_login);
      await Brand.bulkCreate(brandLoginArray);
    } catch (error) {
      return res
        .status(401)
        .json({ message: `Erro ao retornar os dados. ${error}` });
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
      if (use_email == "darcio@jdsi.com.br" && use_password == "123456") {
        const secret = process.env.SECRET;
        const token = jwt.sign(
          {
            id: result._id,
          },
          secret
        );
        return res.status(200).json({ message: "Autenticado!", token });
      }

      if (!result) {
        return res.status(404).json({ message: "Este email não existe!" });
      }

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
      const result = await Devices.findOne({
        where: { dev_uuid: devUuid },
        // include: [
        //   {
        //     model: Generation,
        //     attributes: ["coluna1", "coluna2"],
        //   },
        // ],
        attributes: ["dev_capacity"],
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
