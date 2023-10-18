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
import nodemailer from "nodemailer";
require("dotenv").config();
const googleKeyJson = fs.readFileSync("./googlekey.json", "utf8");
class UsersController {
  //Esta API exibe os detalhes de um usuário com base no UUID fornecido, incluindo nome e e-mail. Se o usuário não for encontrado, retorna uma mensagem de erro.
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
  //Esta API assíncrona processa a criação de um novo usuário com base nos dados fornecidos.
  //Ela verifica a validade do e-mail, se o e-mail já está em uso, a força da senha e se a confirmação de senha coincide. Em seguida, cria o novo usuário no banco de dados, incluindo informações sobre inversores associados a ele.
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
      console.log(email, nome_completo);
      const existingEmail = await Users.findOne({
        attributes: ["use_email"],
        where: { use_email: email },
      });
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      console.log(req.body);
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

      let brandUuids = []; // Array para armazenar os bl_uuids
      for (const inversor of inversores) {
        if (!inversor.login || !inversor.senha) {
          return res.status(400).json({
            message:
              "O login e a senha são obrigatórios para todos os inversores.",
          });
        }
      }
      // Criação do novo usuário na tabela Users
      const newUser = await Users.create({
        use_name: nome_completo,
        use_type_member: false,
        pl_uuid: "2e317d3d-8424-40ca-9e29-665116635eec",
        use_module_numbers: quantidade_inversores,
        use_email: email,
        use_password: passwordHash,
      });
      for (const inversor of inversores) {
        const newBrand = await Brand.create({
          use_uuid: newUser.use_uuid,
          bl_name: inversor.marca,
          bl_login: inversor.login,
          bl_password: inversor.senha,
        });
        //console.log('bl_name:', inversor.brand);
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
    //API  para cliente logar na plataforma(Dashboard)
    try {
      const { use_email, use_password } = req.body;
      console.log("req ", req);
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

      if (!emailRegex.test(use_email)) {
        return res.status(400).json({ message: "O email não é válido." });
      }
      const existingEmail = await Users.findOne({
        attributes: ["use_email"],
        where: { use_email: use_email },
      });
      if (!existingEmail) {
        return res.status(400).json({ message: "O email não existe!" });
      }
      const result = await Users.findOne({
        attributes: [
          "use_uuid",
          "use_name",
          "use_password",
          "use_type_plan",
          "use_type_member",
          "use_email",
          "use_city_state",
          "use_telephone",
        ],
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
  //Esta API assíncrona retorna uma lista de usuários cadastrados no sistema, incluindo seus nomes, e-mails e UUIDs. Além disso, ela também inclui informações sobre as marcas associadas a cada usuário e seus níveis de perfil.
  //Em caso de sucesso, a API retorna os dados em formato JSON com um status 200. Se ocorrer algum erro durante o processo, ela retorna uma mensagem de erro no formato JSON com um status 400.
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
  //Esta API assíncrona retorna detalhes específicos sobre as marcas associadas a um usuário, incluindo os nomes e UUIDs das marcas, bem como informações sobre os dispositivos vinculados a cada marca.
  //Também inclui os dados de geração, temperatura e alertas dos dispositivos.
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
  //Esta API assíncrona retorna informações detalhadas sobre usuários, incluindo nome, e-mail, cidade, endereço de instalação, CEP, capacidade do sistema, tipo de sistema, quantidade de módulos, entre outros dados.
  //Além disso, ela inclui informações sobre os planos de tipo associados a cada usuário.
  async kanban(req, res) {
    try {
      const result = await Users.findAll({
        attributes: [
          "use_name",
          "use_email",

          "use_kwp",

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
  async deviceReturn(req, res) {
    try {
      const { use } = req.query;
      const result = await Brand.findAll({
        where: { use_uuid: use },
        attributes: [],
        include: [
          {
            association: "devices",
            attributes: ["dev_name", "dev_brand", "dev_capacity"],
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
  //Esta API assíncrona gera um relatório de dados relacionados à geração de energia de usuários.
  //Ela inclui informações sobre o nome e e-mail do usuário, bem como detalhes das marcas associadas, dispositivos, geração real e estimada, temperatura e alertas. A busca é limitada ao último mês.
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
  //Esta API permite que o usuário atualize a frequência e a porcentagem de alertas associados ao seu perfil.
  //Ela recebe os novos valores, como a porcentagem e o nome da frequência, e os aplica ao usuário identificado pelo UUID fornecido.
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
  //Esta API assíncrona retorna a porcentagem e o nome da frequência de alertas associados a um usuário específico identificado pelo UUID fornecido.
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
  //
  //Esta API assíncrona retorna dados detalhados relacionados ao dashboard de um usuário específico, identificado pelo UUID fornecido.
  //Ela inclui informações sobre o nome do usuário e suas marcas associadas. Cada marca possui detalhes sobre os dispositivos, incluindo UUID, nome, marca, capacidade, geração real e estimada, alertas e status. A busca é limitada ao mês atual.
  async dashboard(req, res) {
    try {
      const use = req.params.uuid;
      const par = req.params.par;
      const startOfMonth = moment().startOf("month").toDate();
      const endOfMonth = moment().endOf("month").toDate();

      let whereCondition = {};

      if (par === "yes") {
        whereCondition = {
          sta_uuid: "b5f9a5f7-2f67-4ff2-8645-47f55d265e4e",
          dev_deleted: false,
        };
      }

      const result = await Users.findByPk(use, {
        attributes: ["use_name"],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_name", "bl_uuid"],
            include: [
              {
                association: "devices",
                where: whereCondition,
                attributes: [
                  "dev_uuid",
                  "dev_name",
                  "dev_brand",
                  "dev_deleted",
                  "dev_capacity",
                  "dev_address",
                ],
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
  //Esta API assíncrona calcula e atualiza estimativas de geração de energia para um dispositivo específico, com base em dados de irradiação solar fornecidos. Ela recebe informações sobre o estado, cidade, UUID do dispositivo, potência do sistema e nome do contrato.
  //Em seguida, calcula a geração estimada para cada mês do ano, utilizando coeficientes de irradiação solar.
  //Por fim, atualiza os registros na tabela "generation" com as novas estimativas. Além disso, também atualiza informações do dispositivo, como nome do contrato, capacidade e endereço.
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
      deviceToUpdate.dev_address = `${ic_city}-${ic_states}`;

      await deviceToUpdate.save();
      return res
        .status(200)
        .json({ message: "Registros atualizados com sucesso!" });
    } catch (error) {
      return res.status(400).json({ message: `Erro. ${error.message}` });
    }
  }
  //Esta API retorna a soma das capacidades de dispositivos associados a uma marca específica, identificada pelo UUID fornecido. Ela busca os dispositivos com base no UUID da marca e extrai suas capacidades.
  //Em seguida, calcula a soma dessas capacidades e a retorna como sumOfDevCapacities em formato JSON.
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
  //Esta API retorna informações detalhadas sobre um dispositivo específico, identificado pelo UUID fornecido.
  //Ela busca o dispositivo com base no UUID e extrai informações como capacidade, nome do contrato, marca e endereço associados a esse dispositivo. Em seguida, retorna essas informações em formato JSON.
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
  //Esta API retorna o valor anual de irradiação solar associado a uma cidade e estado específicos.
  //Ela recebe como parâmetros os nomes da cidade e estado, converte o estado para maiúsculas e busca na base de dados o coeficiente de irradiação correspondente. Em seguida, retorna o valor anual de irradiação em formato JSON.
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
  //Esta API cria um novo dispositivo de marca (Brand) associado a um usuário específico. Ela recebe como entrada o UUID do usuário (use_uuid), o login (bl_login), o nome (bl_name) e a senha (bl_password) do dispositivo.
  //A API verifica se o dispositivo já está associado ao usuário, e se não estiver, cria um novo dispositivo na tabela Brand e associa a ele um novo registro na tabela Devices.
  async newDevice(req, res) {
    try {
      const { use_uuid, bl_login, bl_name, bl_password } = req.body;
      const search = await Brand.findOne({
        where: { use_uuid: use_uuid, bl_name: bl_name },
      });
      if (search) {
        return res
          .status(400)
          .json({ message: "Você já inseriu esse device!" });
      }
      const device = await Brand.create({
        use_uuid: use_uuid,
        bl_login: bl_login,
        bl_password: bl_password,
        bl_name: bl_name,
      });
      await Devices.create({
        bl_uuid: device.bl_uuid,
      });
      return res
        .status(201)
        .json({ message: "Login/device criado com sucesso!" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Erro ao criar o Login/device: ${error.message}` });
    }
  }
  //Essa API cria um novo dispositivo de marca associado a um usuário específico. Ela recebe informações como o UUID do usuário, login, nome e senha do dispositivo.
  //A API verifica se o dispositivo já está associado ao usuário e, se não estiver, cria um novo dispositivo na tabela Brand e associa a ele um novo registro na tabela Devices.
  async deleteDevice(req, res) {
    try {
      const { devUuid } = req.body;
      await Devices.update(
        {
          dev_deleted: true,
        },
        {
          where: { dev_uuid: devUuid },
        }
      );
      return res.status(201).json({ message: "Device deletado com sucesso!" });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Esta API chamada sendEmail, trata da recuperação de senhas.
  //Ela gera um token JWT para a recuperação de senha, envia um e-mail com o token e atualiza o registro do usuário.
  async sendEmail(req, res) {
    try {
      const { use_email } = req.body;
      const search = await Users.findOne({ where: { use_email } });
      if (!search) {
        return res.status(400).json({ message: "Esse email não existe!" });
      }
      const secret = process.env.SECRET;
      const use_token = jwt.sign(
        {
          id: search._id,
        },
        secret,
        {
          expiresIn: "1h", // O token expirará em uma hora
        }
      );

      await Users.update(
        {
          use_token: use_token,
        },
        {
          where: { use_email: use_email },
        }
      );
      // Configurar o Nodemailer
      const transporter = nodemailer.createTransport({
        service: "outlook",
        auth: {
          user: "mayarecover@outlook.com",
          pass: "maya0075#",
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: "mayarecover@outlook.com",
        to: use_email,
        subject: "Recuperação de Senha",
        html: `
        <p>Clique no link abaixo para recuperar sua senha:</p>
        <a href="https://dashboard.mayaoem.com.br/passwordaRecovery?use_token=${use_token}&use_email=${use_email}">Recuperar Senha</a>
      `,
      };

      // Enviar o email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: "Erro ao enviar o email." });
        } else {
          return res.status(200).json({
            token: use_token,
            message: "Token enviado para o email inserido!",
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erro ao criar ou atualizar o token." });
    }
  }
  //Esta API trata da recuperação de senha.
  //Verifica a validade do token JWT e, se válido, atualiza a senha do usuário com a nova fornecida. Retorna mensagens apropriadas em caso de sucesso ou erro.
  async passwordRecover(req, res) {
    try {
      const { use_email, use_token } = req.query;
      const { use_password } = req.body;

      const user = await Users.findOne({
        where: {
          use_email: use_email,
          use_token: use_token,
        },
      });

      if (!user) {
        return res.status(400).json({ message: "Token ou email inválido." });
      }

      try {
        const secret = process.env.SECRET;
        const decoded = jwt.verify(use_token, secret);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          return res.status(401).json({ message: "Token expirado." });
        }
      } catch (err) {
        return res.status(401).json({ message: "Token inválido." });
      }

      if (use_password.length < 4) {
        return res
          .status(400)
          .json({ message: "A senha precisa ter 4 ou mais caracteres!" });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(use_password, saltRounds);

      await Users.update(
        { use_password: passwordHash },
        {
          where: {
            use_email: use_email,
          },
        }
      );

      return res.status(200).json({
        message: "Senha atualizada com sucesso!",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao criar nova senha!" });
    }
  }
  async cancelUserPlan(req, res) {
    try {
      const { use_uuid } = req.body;
      console.log(use_uuid);
      await Users.update(
        { use_type_plan: false, use_type_member: "" },
        { where: { use_uuid: use_uuid } }
      );

      return res
        .status(200)
        .json({ message: "Seu plano foi cancelado com sucesso!" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao alterar o tipo de membro do cliente!" });
    }
  }
  async UpdateUserInformation(req, res) {
    try {
      const { use_name, use_email, use_city_state, use_telephone, use_uuid } =
        req.body;
      const existingEmail = await Users.findOne({
        attributes: ["use_email"],
        where: { use_email: use_email },
      });
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      console.log(req.body);
      if (!emailRegex.test(use_email)) {
        return res.status(400).json({ message: "O email não é válido." });
      }
      if (existingEmail) {
        return res.status(400).json({ message: "O email já está em uso." });
      }
      await Users.update(
        {
          use_email: use_email,
          use_name: use_name,
          use_city_state: use_city_state,
          use_telephone: use_telephone,
        },
        { where: { use_uuid: use_uuid } }
      );

      return res
        .status(200)
        .json({ message: "Seus dados foram atualizados com sucesso!" });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar os dados!" });
    }
  }
}

export default new UsersController();
