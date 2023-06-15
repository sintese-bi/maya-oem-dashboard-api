//Pensar em uma maneira de criptografar as requests

import { Sequelize, Op } from "sequelize";
import Users from "../models/Users";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Brand from "../models/Brand";
import ProfileLevel from "../models/ProfileLevel";
import TypePlans from "../models/TypePlans";
require("dotenv").config();
import fs from "fs";
import IrradiationCoefficient from "../models/IrradiationCoefficient";
import { google, GoogleApis } from "googleapis";
import { GoogleAuth } from "google-auth-library";
const googleKeyJson = fs.readFileSync("./googlekey.json", "utf8");
import moment from "moment-timezone";
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
    //O cliente logará com email e senha nessa API de login
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
                    order: [["alert_created_at", "DESC"]],
                    limit: 1,
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
      return res
        .status(400)
        .json({ message: "Erro ao restornar os dados!" });
    }
  }

  async dashboard(req, res) {
    try {
      const use = req.params.uuid;

      const daysPassed = moment().diff(moment().startOf("month"), "days") + 1;

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
                        [Op.between]: [
                          moment().subtract(daysPassed, "day").toDate(),
                          moment().toDate(),
                        ],
                      },
                    },
                    order: [["gen_updated_at", "DESC"]],
                  },
                  {
                    association: "alerts",
                    attributes: ["al_alerts", "al_inv"],
                    // where: {
                    //   alert_created_at: {
                    //     [Op.between]: [
                    //       moment().subtract(24, "hour").toDate(),
                    //       moment().toDate(),
                    //     ],
                    //   },
                    // },
                    order: [["alert_created_at", "DESC"]],
                    // limit: 1,
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
//saulo mudar tambem
  async saulo(req, res) {
    try {
      const { ic_city } = req.params;
      const resulta = await IrradiationCoefficient.findOne({
        where: { ic_city },
        attributes: ["ic_yearly"],
      });
      return res.status(200).json(resulta);
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new UsersController();
