const axios = require("axios");

// const CLIENT_GEN_W_MAYA = "1";
// const CLIENT_GEN_WO_MAYA = "2";
// const EFF_VALUE = "3";
const EFF_PERC = "30";


class PandaDocController {
  async handler(req, res) {
    try {
      const {
        clientPot,
        clientEstimated,
        clientFirstName,
        clientCity,
        clientModNum,
        clientGenWMaya,
        clientGenWOMaya,
        EffValue
      } = req.body;

      console.log(clientPot, clientEstimated);

      const documentId = "tEYU2ZLQYgscFLaL7p8U5N";
      const apiKey = "597c4ce7e2bce349973d60f3a1c440c38975d956";

      const url = "https://api.pandadoc.com/public/v1/documents";

      const data = {
        name: "Simple API Sample Document from PandaDoc Template",
        template_uuid: "tEYU2ZLQYgscFLaL7p8U5N",
        recipients: [
          {
            email: "test@gmail.com",
            first_name: "usuario ",
            last_name: "teste",
          },
        ],
        tokens: [
          {
            name: "Client.Pot",
            value: clientPot,
          },
          {
            name: "Client.ModNum",
            value: clientModNum,
          },
          {
            name: "Client.Estimated",
            value: clientEstimated,
          },
          {
            name: "Client.FirstName",
            value: clientFirstName,
          },
          {
            name: "Client.City",
            value: clientCity,
          },
          {
            name: "Client.GenWMaya",
            value: clientGenWMaya,
          },
          {
            name: "Client.GenWOMaya",
            value: clientGenWOMaya,
          },
          {
            name: "EffValue",
            value: EffValue,
          },
          {
            name: "EffPerc",
            value: EFF_PERC,
          },
          
        ],
      };

      const response = await axios.post(
        `https://api.pandadoc.com/public/v1/documents`,
        data,
        {
          headers: {
            Authorization: `API-Key ${apiKey}`,
            accept: "application/json",
            "content-type": "application/json",
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log("chegou");
        return res.status(200).json({ message: `Documento criado` });
      } else {
        return res.status(200).json({ message: `sucesso` });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new PandaDocController();
