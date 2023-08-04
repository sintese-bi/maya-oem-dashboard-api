import axios from "axios";
import sleep from "../helpers/utils";

// const CLIENT_GEN_W_MAYA = "1";
// const CLIENT_GEN_WO_MAYA = "2";
// const EFF_VALUE = "3";
// const EFF_PERC = "30";
// const clientMega = "teste";
// const clientGiga = "a";
// const clientKilo = "b";

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
        EffValue,
        clientData,
        clientKilo,
        clientMega,
        clientGiga,
        clientPercentage,
      } = req.body;

      console.log({'resultados':[clientPot, clientEstimated,clientGenWOMaya]});

      const documentId = "GhYizEPrVBpLqpe8J6wYD2";
      const apiKey = "597c4ce7e2bce349973d60f3a1c440c38975d956";

      const url = "https://api.pandadoc.com/public/v1/documents";
      const header = {
        Authorization: `API-Key ${apiKey}`,
        accept: "application/json",
        "content-type": "application/json",
      };
      const data = {
        name: "Simple API Sample Document from PandaDoc Template",
        template_uuid: "fjswHDzWxipJin9exETDha",
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
            name: "Client.Modulos",
            value: clientModNum,
          },
          {
            name: "Client.Est",
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
            name: "Client.estimada",
            value: clientGenWMaya,
          },
          {
            name: "Client.estimadaS",
            value: clientGenWOMaya,
          },
          {
            name: "Client.Eff",
            value: EffValue,
          },
          {
            name: "Client.kilo",
            value: clientKilo,
          },
          {
            name: "Client.mega",
            value: clientMega,
          },
          {
            name: "Client.giga",
            value: clientGiga,
          },

          {
            name: "Client.data",
            value: clientData,
          },
          {
            name: "Client.Percent",
            value: clientPercentage,
          },
        ],
      };

      const response = await axios.post(url, data, {
        headers: header,
      });

      if (response.status >= 200 && response.status < 300) {
        console.log("chegou");
        console.log(clientGenWOMaya)
        const { uuid } = response.data;
        console.log(uuid);
        await sleep(3000);
        //Obter o documento gerado
        // const documentResponse = await axios.post(`${url}/${uuid}/send`, {
        //   headers: header,
        // });
        const options = {
          method: "POST",
          headers: {
            Authorization: `API-Key ${apiKey}`,
            accept: "application/json",
            "content-type": "application/json",
          },
        };
        let responseDoc = [];
        await fetch(
          `https://api.pandadoc.com/public/v1/documents/${uuid}/send`,
          options
        )
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            responseDoc = data;
          })
          .catch((error) => {
            const { response: err } = error;
            const message =
              err && err.data ? err.data.message : "Erro desconhecido";
            return res
              .status(400)
              .json({ message: `Erro ao retornar os dados. ${error}` });
          });
        console.log("Documento gerado:");

        return res.status(200).json(responseDoc);
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
