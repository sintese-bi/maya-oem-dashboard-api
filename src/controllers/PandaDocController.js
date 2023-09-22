import axios from "axios";
import sleep from "../helpers/utils";
import Proposal from "../models/Proposal";
import { v4 as uuidv4 } from "uuid";
// const CLIENT_GEN_W_MAYA = "1";
// const CLIENT_GEN_WO_MAYA = "2";
// const EFF_VALUE = "3";
// const EFF_PERC = "30";
// const clientMega = "teste";
// const clientGiga = "a";
// const clientKilo = "b";

class PandaDocController {
  //Esta API processa dados de propostas de geração de energia e os envia para a plataforma PandaDoc para geração de documentos.
  //Os dados são utilizados para preencher um modelo de documento, que é então enviado para o cliente via e-mail. A API também registra e gerencia os números de proposta.
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

      console.log({
        resultados: [clientPot, clientEstimated, clientGenWOMaya],
      });

      const documentId = "GhYizEPrVBpLqpe8J6wYD2";
      const apiKey = "597c4ce7e2bce349973d60f3a1c440c38975d956";

      const url = "https://api.pandadoc.com/public/v1/documents";
      const header = {
        Authorization: `API-Key ${apiKey}`,
        accept: "application/json",
        "content-type": "application/json",
      };
      const lastProposal = await Proposal.findOne({
        attributes: ["prop_number"],
        order: [["prop_number", "DESC"]],
      });

      let nextProposalNumber = 1; // Começando em 1
      if (lastProposal) {
        const lastNumber = parseInt(lastProposal.prop_number.split("-")[0]);
        nextProposalNumber = lastNumber + 1;
      }

      // Formatar o próximo número da proposta com zeros à esquerda
      const formattedProposalNumber = nextProposalNumber
        .toString()
        .padStart(3, "0");

      await Proposal.create({
        prop_uuid: uuidv4(),
        prop_number: `${formattedProposalNumber}-${new Date().getFullYear()}`,
      });
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
          {
            name: "Client.propNumber",
            value: `${formattedProposalNumber}-${new Date().getFullYear()}`,
          },
        ],
      };

      const response = await axios.post(url, data, {
        headers: header,
      });

      if (response.status >= 200 && response.status < 300) {
        console.log("chegou");
        console.log(clientGenWOMaya);
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
