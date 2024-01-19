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
import Invoice from "../models/Invoice";
import csvParser from "csv-parser";
import createCsvWriter from "csv-writer";
import Reports from "../models/Reports";
import cron from "node-cron";
import Invoice_received from "../models/Invoice_received";
import Brand_Info from "../models/Brand_info";
require("dotenv").config();
const googleKeyJson = fs.readFileSync("./googlekey.json", "utf8");
//Configuração das credenciais do email de envio
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,

  secure: true, //alterar
  auth: {
    user: "noreplymayawatch@gmail.com",
    pass: "xbox ejjd wokp ystv",
  },
  // tls: {
  //   rejectUnauthorized: false, //Usar "false" para ambiente de desenvolvimento
  // },
});

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
        use_type_member: true,
        pl_uuid: "049686ee-5d83-4edf-9972-8e432deccf1f",
        use_module_numbers: quantidade_inversores,
        use_email: email,
        use_password: passwordHash,
        use_deleted: false,
      });
      let bl_url;
      for (const inversor of inversores) {
        switch (inversor.marca) {
          case "aurora":
            bl_url =
              "https://www.auroravision.net/ums/v1/loginPage?redirectUrl=https:%2F%2Fwww.auroravision.net%2Fdash%2Fhome.jsf&cause=MISSING_TOKEN";
            break;
          case "apsystems":
            bl_url = "https://apsystemsema.com/ema/index.action";
            break;
          case "canadian":
            bl_url = "https://monitoring.csisolar.com/login";
            break;
          case "fronius":
            bl_url = "https://www.solarweb.com/PvSystems/Widgets";
            break;
          case "fusion":
            bl_url =
              "https://la5.fusionsolar.huawei.com/unisso/login.action?service=%2Funisess%2Fv1%2Fauth%3Fservice%3D%252F";
            break;
          case "goodwe":
            bl_url = "https://www.semsportal.com/PowerStation/powerstatus";
            break;
          case "growatt":
            bl_url = "https://server.growatt.com/index";
            break;
          case "solarman":
            bl_url = "https://pro.solarmanpv.com/business/maintain/plant";
            break;
          case "solarz":
            bl_url = "https://app.solarz.com.br/login";
            break;
          case "renovigi":
            bl_url =
              "https://www.renovigi.solar/cus/renovigi/index_po.html?1690209459489";
            break;
          case "weg":
            bl_url = "https://iot.weg.net/#/portal/main";
            break;
          case "isolar-cloud":
            bl_url = "https://www.isolarcloud.com.hk/?lang=pt_BR";
            break;
          case "hoymiles":
            bl_url =
              "https://global.hoymiles.com/platform/login?form=logout&notice=1";
            break;
        }
        const loginSemAspas = inversor.login.replace(/^"(.*)"$/, "$1");
        console.log({ message: bl_url });
        const newBrand = await Brand.create({
          use_uuid: newUser.use_uuid,
          bl_name: inversor.marca.toLowerCase(),
          bl_login: loginSemAspas,
          bl_password: inversor.senha,
          bl_url: bl_url,
          bl_check: "x",
        });
        //console.log('bl_name:', inversor.brand);
        brandUuids.push({
          bl_uuid: newBrand.bl_uuid,
          marca: inversor.marca,
        }); // Armazena cada bl_uuid e marca no array
      }

      // // Agora, criar os registros na tabela "devices" com os bl_uuids e marcas armazenados
      // for (const item of brandUuids) {
      //   await Devices.create({
      //     bl_uuid: item.bl_uuid,
      //     dev_brand: item.marca.toLowerCase(),
      //   });
      // }
      const emailBody = `
      <p>Olá,</p>
              
      <p>Seu registro foi efetuado com sucesso!</p>
                      
      <p>Você pode conferir todas as funcionalidades e aprender a utilizar nosso dashboard através do contato (31) 9 8234-1415.</p>
                          
      <p>Se houver qualquer necessidade de alteração nos dados informados, por favor, não hesite em nos contactar para atualização pelo e-mail suportemayawatch@gmail.com.</p>
                      
      <p>Se você tiver alguma dúvida ou precisar de suporte adicional, estamos à sua disposição. Sua satisfação e sucesso são nossas principais prioridades!</p>

      <p>Seu login para acessar o Dashboard é: ${email} e a senha: ${password}<p>
      <p>Agradecemos pela confiança em nossos serviços.</p>
                      
      <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
                  `;
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const mailOptions = {
        from: '"noreplymayawatch@gmail.com',
        to: email,
        subject: "Registro de usuário.",
        text: "",
        html: emailBody,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Erro ao enviar o e-mail:", error);
        } else {
          console.log("E-mail enviado:", info.res);
        }
      });
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
      console.log("req", req);
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

      const userDevices = await Devices.findAll({
        attributes: ["dev_uuid"],
        include: [
          {
            association: "brand_login",
            attributes: [],
            where: {
              use_uuid: result.use_uuid,
            },
          },
        ],
      });

      const checkPassword = await bcrypt.compare(
        use_password,
        result.use_password
      );
      // if (use_password !== result.use_password) {
      //   return res.status(404).json({ message: "Senha inválida" });
      // }
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

      return res.status(200).json({
        message: "Autenticado!",
        token,
        result: {
          use_data: without_password,
          use_devices_amount: userDevices.length,
        },
      }); //remove o use_password no retorno do json
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
        attributes: ["use_name", "use_email", "use_uuid", "use_deleted"],
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
      console.log(startOfMonth, endOfMonth);
      let whereCondition = {};

      if (par === "yes") {
        whereCondition = {
          [Op.or]: [{ dev_deleted: false }, { dev_deleted: { [Op.is]: null } }],
        };
      }
      const brand = await Users.findByPk(use, {
        include: [
          {
            association: "brand_login",
            attributes: ["bl_name", "bl_uuid"],
          },
        ],
      });

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
                  "dev_lat",
                  "dev_long",
                  "dev_email",
                  "dev_image",
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
                    required: false,
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
      // const result_1 = result.brand_login.map((device_0) => {
      //   brand_login.devices.map((device) => {
      //     if (device.generation.length == 0) {
      //       console.log(device.generation);
      //       delete device.generation;
      //       console.log(device.generation);
      //     }
      //   });
      // });

      // console.log(result.brand_login[0]);

      return res.status(200).json({ result, brand });
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
      const { use_uuid, bl_login, bl_name, bl_password, bl_url, bl_quant } =
        req.body;
      const search = await Brand.findOne({
        where: { use_uuid: use_uuid, bl_name: bl_name, bl_login: bl_login },
      });
      if (search) {
        return res.status(400).json({
          message: "Você já inseriu um login de mesmo nome para essa marca!",
        });
      }
      const device = await Brand.create({
        use_uuid: use_uuid,
        bl_login: bl_login,
        bl_password: bl_password,
        bl_name: bl_name,
        bl_url: bl_url,
        bl_quant: bl_quant,
      });
      // await Devices.create({
      //   bl_uuid: device.bl_uuid,
      // });
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
  async updateBrands(req, res) {
    try {
      const { use_uuid, bl_name, bl_login, bl_password, bl_url } = req.body;

      const result = await Brand.findOne({
        where: { use_uuid: use_uuid, bl_name: bl_name, bl_login: bl_login },
      });

      if (result) {
        if (bl_url == "") {
          const update0 = await Brand.update(
            {
              bl_password: bl_password,
            },
            {
              where: {
                use_uuid: use_uuid,
                bl_name: bl_name,
                bl_login: bl_login,
              },
            }
          );
        } else {
          const update1 = await Brand.update(
            {
              bl_password: bl_password,
              bl_url: bl_url,
            },
            {
              where: {
                use_uuid: use_uuid,
                bl_name: bl_name,
                bl_login: bl_login,
              },
            }
          );
        }
      } else {
        return res.status(400).json({
          message: "Esse login não existe em nosso banco de dados!",
        });
      }
      return res.status(201).json({ message: "Senha atualizada com sucesso!" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Erro ao atualizar a senha: ${error.message}` });
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
      const data = await Users.findByPk(
        use_uuid,

        {
          attributes: [
            "use_uuid",
            "use_name",
            "use_type_plan",
            "use_type_member",
            "use_email",
            "use_city_state",
            "use_telephone",
          ],
        }
      );
      return res.status(200).json({
        message: "Seus dados foram atualizados com sucesso!",
        Informações: data,
      });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar os dados!" });
    }
  }
  //Essa API é responsável por enviar e-mails com relatórios em formato PDF para os endereços associados a dispositivos específicos.
  //Ela aceita uma requisição contendo uma matriz de objetos, onde cada objeto possui um dev_uuid identificando um dispositivo e o conteúdo do PDF em formato base64 (base64).
  async massEmail(req, res) {
    try {
      const pdfDataArray = req.body; // Array de objetos com dev_uuid e base64 do PDF

      const mailPromises = pdfDataArray.map(async (pdfData) => {
        const { base64, dev_uuid } = pdfData;

        const attachment = {
          filename: "relatorio.pdf",
          content: base64,
          encoding: "base64",
        };

        const searchDeviceEmail = await Devices.findOne({
          where: { dev_uuid: dev_uuid },
          attributes: ["dev_email"],
        });

        const emailBody = `
          Prezado usuário,
          
          Anexamos um relatório em formato PDF com os dados de geração da usina. Este relatório inclui informações referentes à geração diária, semanal e mensal, apresentadas de forma clara e concisa.
  
          Além disso, no documento, você encontrará um gráfico temporal que ilustra a variação na produção de energia ao longo do período analisado.
  
          <p>Atenciosamente,<br>Equipe MAYA WATCH</p>
        `;

        const mailOptions = {
          from: '"noreplymayawatch@gmail.com',
          to: [searchDeviceEmail.dev_email],
          subject: "Relatório de dados de Geração",
          text: "",
          html: emailBody,
          attachments: [attachment],
        };

        try {
          await transporter.sendMail(mailOptions);
          return {
            success: true,
            message: `Email enviado com sucesso para dev_uuid: ${dev_uuid}`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Erro ao enviar o email para dev_uuid: ${dev_uuid} - ${error}`,
          };
        }
      });

      const results = await Promise.all(mailPromises);

      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: "Erro ao retornar os dados!" });
    }
  }
  //Essa API atualiza o endereço de e-mail de um usuário usando o UUID fornecido (use_uuid).
  //Ela verifica se o novo e-mail é válido, se ainda não está em uso por outro usuário e, em seguida, atualiza o e-mail na base de dados.
  async portalemailLogins(req, res) {
    try {
      const { use_uuid, use_email } = req.body;
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
        { use_email: use_email },
        { where: { use_uuid: use_uuid } }
      );
      return res.status(200).json({ message: "Email atualizado com sucesso!" });
    } catch (error) {
      {
        return res.status(500).json({ message: "Erro ao atualizar o email!" });
      }
    }
  }
  async deviceInformation(req, res) {
    try {
      const { use_uuid } = req.body;

      const result = await Devices.findAll({
        attributes: [
          "dev_email",
          "dev_name",
          "dev_brand",
          "dev_capacity",
          "dev_uuid",
          "dev_address",
        ],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_uuid"],
            where: {
              use_uuid: use_uuid,
            },
          },
        ],
      });
      return res.status(200).json(result);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao retornar os dados das plantas!" });
    }
  }
  //Essa API retorna informações específicas de dispositivos associados a um usuário, identificado pelo UUID fornecido (use_uuid).
  //As informações incluem o e-mail, nome, marca, capacidade, UUID e endereço do dispositivo. Esses dados são filtrados com base na associação do usuário com a marca do dispositivo.
  async updatedeviceEmail(req, res) {
    try {
      const { arraydevices } = req.body;

      arraydevices.map(async (devarray) => {
        const { dev_uuid, dev_capacity, dev_email } = devarray;

        await Devices.update(
          { dev_capacity: dev_capacity, dev_email: dev_email },

          { where: { dev_uuid: dev_uuid } }
        );
      });
      return res
        .status(200)
        .json({ message: "Emails atualizados com sucesso!" });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar dados!" });
    }
  }
  //Esta API gera um arquivo CSV com informações de capacidade de dispositivos associados a um usuário, identificado pelo UUID fornecido.
  //O arquivo inclui a capacidade do dispositivo, o UUID e o nome da marca. Em caso de sucesso, o CSV é baixado como resposta; em caso de erro, uma mensagem é retornada.
  async csvDownload(req, res) {
    try {
      const { use_uuid } = req.body;
      const result = await Devices.findAll({
        attributes: ["dev_capacity"],
        include: [
          {
            association: "brand_login",
            where: { use_uuid: use_uuid },
            attributes: ["bl_uuid", "bl_name"],
          },
        ],
      });
      const informations = result.map((item) => [
        item.dev_capacity,
        item.brand_login.bl_uuid,
      ]);
      console.log(informations);
      const csvWriter = createCsvWriter({
        path: "information.csv",
      });
      console.log(csvWriter);
      csvWriter

        .then(() => {
          console.log("CSV file written successfully");
          return res.download("informations.csv");
        })
        .catch((error) => {
          console.error("Error writing CSV file:", error);
          return res
            .status(500)
            .json({ message: "Não foi possível gerar o CSV!" });
        });
    } catch (error) {
      return res.status(500).json({ message: "Não foi possível geral o CSV!" });
    }
  }
  //Esta API atualiza informações de dispositivos e geração de energia com base em um conjunto de dados fornecido.
  // Calcula uma nova estimativa de geração de energia usando coeficientes de irradiação, atualiza registros de geração, e ajusta as capacidades dos dispositivos.
  async updatePlants(req, res) {
    try {
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

      const arrayplants = req.body.arrayplants.filter(
        (data) =>
          data.dev_uuid !== undefined ||
          data.dev_capacity !== undefined ||
          data.ic_city !== undefined ||
          data.ic_states !== undefined ||
          data.dev_image !== undefined ||
          data.dev_email !== undefined
      );

      await Promise.all(
        arrayplants.map(async (devarray) => {
          const {
            dev_uuid,
            dev_capacity,
            dev_email,
            ic_city,
            ic_states,
            dev_image,
          } = devarray;
          // console.log(ic_states, dev_image);
          if (ic_city != undefined && ic_states != undefined) {
            let irr = await IrradiationCoefficient.findOne({
              where: { ic_city, ic_states },
              attributes: ["ic_yearly"],
            });

            const result = await Devices.findOne({
              attributes: ["dev_name"],
              where: { dev_uuid: dev_uuid },
            });

            if (!irr) {
              const ic_year = 5.04;
              const gen_new = dev_capacity * ic_year * 0.81;
              await Generation.update(
                { gen_estimated: gen_new },
                {
                  where: {
                    dev_uuid: dev_uuid,
                    gen_date: {
                      [Op.between]: [firstDayOfMonth, lastDayOfMonth],
                    },
                  },
                }
              );
              console.log(
                `Por favor, verifique se a cidade e/ou estado de "${result.dev_name}" foi inserida corretamente!`
              );
            } else {
              const ic_year = irr.dataValues.ic_yearly;
              const gen_new = dev_capacity * ic_year * 0.81;
              await Generation.update(
                { gen_estimated: gen_new },
                {
                  where: {
                    dev_uuid: dev_uuid,
                    gen_date: {
                      [Op.between]: [firstDayOfMonth, lastDayOfMonth],
                    },
                  },
                }
              );
            }
          }
          await Devices.update(
            {
              dev_capacity: dev_capacity,
              dev_email: dev_email,
              dev_image: dev_image,
              dev_address: ic_city + "-" + ic_states,
            },
            { where: { dev_uuid: dev_uuid } }
          );
        })
      );

      return res
        .status(200)
        .json({ message: "Dados atualizados com sucesso!" });
    } catch (error) {
      console.error(error);

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          message: "Erro de validação do Sequelize.",
          error: error.errors,
        });
      }

      return res
        .status(500)
        .json({ message: `Erro interno do servidor: ${error.message}` });
    }
  }

  //Esta API desativa um usuário, modificando seu tipo de membro para 'free' e associando-o a um determinado perfil.
  //Em caso de sucesso, retorna uma mensagem de atualização bem-sucedida; em caso de erro, retorna uma mensagem de falha.
  async deleteUser(req, res) {
    try {
      const { use_uuid } = req.body;
      await Users.update(
        {
          use_type_member: false,
          pl_uuid: "2e317d3d-8424-40ca-9e29-665116635eec",
          use_deleted: true,
        },

        { where: { use_uuid: use_uuid } }
      );
      return res
        .status(200)
        .json({ message: "Dados atualizados com sucesso!" });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar dados!" });
    }
  }

  async reportCounting(req, res) {
    try {
      // Verifica o mês atual
      const currentDate = new Date();
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      // Consulta o banco de dados para obter dev_uuid distintos inseridos no mês atual
      const uniqueDevUuids = await Reports.findAll({
        attributes: [
          [
            Reports.sequelize.fn("DISTINCT", Reports.sequelize.col("dev_uuid")),
            "dev_uuid",
          ],
        ],
        where: {
          createdAt: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      });

      // Conta o número total de dev_uuid distintos
      const Contagem = uniqueDevUuids.length;

      return res
        .status(200)
        .json({ "Quantidade de relatórios distintos baixados:": Contagem });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Erro ao atualizar dados:${error}` });
    }
  }
  async storeReport(req, res) {
    try {
      const { dev_uuid } = req.body;

      // Cria o registro no banco de dados
      await Reports.create({ port_check: true, dev_uuid: dev_uuid });

      return res
        .status(200)
        .json({ message: "Dados atualizados com sucesso!" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Erro ao atualizar dados:${error}` });
    }
  }
  async Invoice(req, res) {
    try {
      const {
        use_uuid,
        voice_login,
        voice_password,
        voice_install,
        voice_client,
        voice_company,
      } = req.body;
      // const register = await Invoice.findOne({ where: { use_uuid: use_uuid } });
      // if (register) {
      //   return res.status(500).json({ message: "Esse cadastro já existe!" });
      // }
      const result = await Invoice.create({
        use_uuid: use_uuid,
        voice_login: voice_login,
        voice_password: voice_password,
        voice_install: voice_install,
        voice_client: voice_client,
        voice_company: voice_company,
      });
      return res
        .status(200)
        .json({ message: "Dados cadastrados com sucesso!" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: `Erro ao atualizar dados:${error}` });
    }
  }

  async invoiceReturn(req, res) {
    try {
      const clientToken = req.headers.authorization;

      if (!clientToken) {
        return res.status(401).json({ message: "Token não fornecido." });
      }

      const expectedToken = process.env.TOKEN;

      if (clientToken == `Bearer ${expectedToken}`) {
        const result = await Invoice.findAll({
          attributes: [
            "voice_login",
            "voice_password",
            "voice_install",
            "voice_client",
            "voice_company",
            "voice_uuid",
          ],
        });

        return res.status(200).json({ message: result });
      } else {
        return res
          .status(401)
          .json({ message: "Falha na autenticação: Token inválido." });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao atualizar dados:${error}` });
    }
  }

  async InvoiceReceived(req, res) {
    try {
      const {
        ir_periodo,
        ir_modalidade,
        ir_instalacao,
        ir_quota,
        ir_postohorario,
        ir_qtdconsumo,
        ir_qtdgeracao,
        ir_qtdcompensacao,
        ir_qtdsaldoant,
        ir_qtdtransferencia,
        ir_qtdrecebimento,
        ir_qtdsaldoatual,
        ir_valorkwh,
        voice_uuid,
      } = req.body;

      const clientToken = req.headers.authorization;
      if (!clientToken) {
        return res.status(401).json({ message: "Token não fornecido." });
      }
      const expectedToken = process.env.TOKEN;
      console.log(expectedToken);
      if (clientToken == `Bearer ${expectedToken}`) {
        const result = await Invoice.findOne({
          where: { voice_uuid: voice_uuid },
        });
        // console.log(result.voice_uuid)
        if (!result) {
          return res.status(404).json({
            message: "Não existe registro de usuário com esse voice_uuid!",
          });
        } else {
          await Invoice_received.create({
            ir_periodo: ir_periodo,
            ir_modalidade: ir_modalidade,
            ir_instalacao: ir_instalacao,
            ir_quota: ir_quota,
            ir_postohorario: ir_postohorario,
            ir_qtdconsumo: ir_qtdconsumo,
            ir_qtdgeracao: ir_qtdgeracao,
            ir_qtdcompensacao: ir_qtdcompensacao,
            ir_qtdsaldoant: ir_qtdsaldoant,
            ir_qtdtransferencia: ir_qtdtransferencia,
            ir_qtdrecebimento: ir_qtdrecebimento,
            ir_qtdsaldoatual: ir_qtdsaldoatual,
            ir_valorkwh: ir_valorkwh,
            voice_uuid: voice_uuid,
          });

          return res
            .status(200)
            .json({ message: "Dados criados com sucesso!" });
        }
      } else {
        return res
          .status(401)
          .json({ message: "Falha na autenticação: Token inválido." });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao criar os dados. ${error}` });
    }
  }

  async brandInformation(req, res) {
    try {
      const { use_uuid } = req.body;

      const infoBrand = await Brand.findAll({
        attributes: ["bl_login", "bl_password", "bl_check"],
        where: { use_uuid: use_uuid },
      });

      const result = await Brand_Info.findAll({
        attributes: ["bl_name", "bl_url"],
      });
      const modifiedResult = result.map((item) => ({
        bl_name: item.bl_name.toUpperCase(),
        bl_url: item.bl_url,
      }));

      return res.status(200).json({ message: [modifiedResult, infoBrand] });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  //Api de teste para criação de brands
  async brandCreationUpdate(req, res) {
    try {
      const { arraybrands } = req.body;

      await Promise.all(
        arraybrands.map(async (brand) => {
          await Brand.create({
            bl_login: brand.brand_login,
            bl_password: brand.brand_password,
            bl_name: brand.brand_name,
            use_uuid: brand.use_uuid,
          });
        })
      );
      return res
        .status(200)
        .json({ message: "Marcas atualizadas com sucesso!" });
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async useAlertEmail(req, res) {
    try {
      const { use_uuid, use_alert_email } = req.body;
      // const existingEmail = await Users.findOne({
      //   attributes: ["use_alert_email"],
      //   where: { use_uuid: use_uuid },
      // });
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

      if (!emailRegex.test(use_alert_email)) {
        return res.status(400).json({ message: "O email não é válido." });
      }
      await Users.update(
        { use_alert_email: use_alert_email },
        { where: { use_uuid: use_uuid } }
      );
      return res.status(200).json({
        message: "O email para envio de alertas foi cadastrado com sucesso!",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
  async emailAlert(req, res) {
    try {
      const result = await Users.findAll({
        attributes: ["use_name", "use_alert_email"],
        include: [
          {
            association: "brand_login",
            attributes: ["bl_name"],
            include: [
              {
                association: "devices",
                attributes: ["dev_name", "dev_deleted"],
                include: [
                  {
                    association: "alerts",
                    attributes: ["al_alerts", "al_inv", "alert_created_at"],
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

      for (const user of result) {
        const userEmail = user.use_alert_email;

        if (user.brand_login) {
          const hasAlerts = user.brand_login.some((brand) => {
            return (
              brand.devices &&
              brand.devices.some((device) => {
                return (
                  device.alerts &&
                  device.alerts.length > 0 &&
                  (device.dev_deleted === false || device.dev_deleted === null)
                );
              })
            );
          });

          if (hasAlerts) {
            const alertEmailBody = user.brand_login
              .filter((brand) => brand.devices && brand.devices.length > 0)
              .map((brand) => {
                const brandName = brand.bl_name;
                const devicesWithAlerts = brand.devices.filter(
                  (device) =>
                    device.alerts &&
                    device.alerts.length > 0 &&
                    (device.dev_deleted === false ||
                      device.dev_deleted === null)
                );

                if (devicesWithAlerts.length > 0) {
                  const deviceAlerts = devicesWithAlerts.map((device) => {
                    const devName = device.dev_name;
                    const deviceAlertList = device.alerts.map((alert) => {
                      return `<p>
                      Nome do dispositivo: ${devName},<br>
                      Alerta: ${alert.al_alerts},<br>
                      Inversor: ${alert.al_inv},<br>
                      Horário do alerta: ${moment(alert.alert_created_at)
                        .tz("America/Sao_Paulo")
                        .format("YYYY-MM-DD HH:mm:ss")}
                    </p>`;
                    });

                    return deviceAlertList.join("");
                  });

                  return `<h3>${brandName}</h3>${deviceAlerts.join("")}`;
                } else {
                  return ""; // Se não houver dispositivos com alertas, retorna uma string vazia
                }
              })
              .filter((brandBody) => brandBody !== "") // Filtra marcas sem dispositivos com alertas
              .join("");

            if (alertEmailBody !== "") {
              const additionalText =
                "<p><strong>A seguir, temos os alertas dos dispositivos de geração, eles são enviados de hora em hora. </strong></p>";

              if (userEmail) {
                const mailOptions = {
                  from: '"noreplymayawatch@gmail.com"',
                  to: [userEmail, "bisintese@gmail.com", "eloymun00@gmail.com"],
                  subject: "Alertas dos dispositivos de geração",
                  text: "Lista de alertas",
                  html: additionalText + alertEmailBody,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    console.log(`Erro ao enviar para ${userEmail}!`);
                    console.error(error);
                  } else {
                    console.log(`Email enviado com sucesso para ${userEmail}!`);
                  }
                });
              } else {
                console.log(
                  `Não há endereço de e-mail para o usuário ${user.use_name}.`
                );
              }
            } else {
              console.log(`${userEmail} does not have alerts`);
            }
          } else {
            console.log(`${userEmail} does not have alerts`);
          }
        } else {
          console.log(`${userEmail} does not have brand_login`);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  agendarVerificacaoDeAlertas() {
    // Agende a função para ser executada a cada minuto
    cron.schedule("39 * * * *", async () => {
      try {
        await this.emailAlert();
      } catch (error) {
        console.error("Erro durante a verificação de alertas:", error);
      }
    });
  }
}
const usersController = new UsersController();
// usersController.agendarVerificacaoDeAlertas();
export default new UsersController();
