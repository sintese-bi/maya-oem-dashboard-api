import express from "express";

// CONTROLLER's
import GenerationController from "./controllers/GenerationController";
import DevicesControlle from "./controllers/DevicesController";
import InvestmentController from "./controllers/InvestmentController";
import IrradiationCoefficientController from "./controllers/IrradiationCoefficientController";
import UsersController from "./controllers/UsersController";
import PandaDocController from "./controllers/PandaDocController";
import StripeController from "./controllers/StripeController";

//Esse script importa controladores que lidam com diversas funcionalidades, como geração de energia, dispositivos, usuários, entre outros.
//Além disso, inclui middleware para autenticação via token JWT e configurações para upload de arquivos.
//As rotas são organizadas em versões (v1) e algumas exigem autenticação, enquanto outras não.

// SERVICE's
import checkToken from "./service/token";
import multer from "multer";
import DevicesController from "./controllers/DevicesController";
const storage = multer.memoryStorage(); // Armazenar o arquivo na memória
const upload = multer({ storage: storage }); // Define a pasta onde os arquivos serão armazenados

// STADOS DE CONTROLLER
const apiVersion = "/v1";
const routes = express.Router();

// ----------------------------------------------------------------------------
// ROTAS SEM AUTENTICAÇÃO
// routes.post(
//   `${apiVersion}/genrealdaylasthour`,
//   DevicesControlle.sumGenerationLastHour
// );
routes.post(`${apiVersion}/genrealday`, DevicesControlle.sumGeneration);
routes.post(`${apiVersion}/login`, UsersController.login);
// routes.post(
//   `${apiVersion}/stripe-webhook`,
//   StripeController.handleStripeWebhook
// );
routes.get(`${apiVersion}/generationReport`, UsersController.generationReport);
routes.get(`${apiVersion}/investment`, InvestmentController.index);
routes.get(`${apiVersion}/kanban`, UsersController.kanban);
routes.post(`${apiVersion}/devreturn`, UsersController.deviceReturn);
routes.post(
  `${apiVersion}/deleteDevice`,
  checkToken,
  UsersController.deleteDevice
);
routes.get(
  `${apiVersion}/irrcoef/:devUuid/:ic_states/:ic_city`,
  UsersController.irradiation
);
routes.get(
  `${apiVersion}/irrcoef_2/:ic_states/:ic_city`,
  UsersController.irradiation_2
);

routes.get(
  `${apiVersion}/irradiationCoefficient`,
  IrradiationCoefficientController.index
);
routes.post(`${apiVersion}/pandadoc`, PandaDocController.handler);
routes.post(`${apiVersion}/uselogo`, checkToken, UsersController.useLogo);
routes.get(`${apiVersion}/report/:blUuid`, UsersController.report);
routes.get(`${apiVersion}/reportclient/:devUuid`, UsersController.reportClient);
// ----------------------------------------------------------------------------
// ROTAS COM AUTENTICAÇÃO
routes.post(
  `${apiVersion}/sendgenerationemail`,
  checkToken,
  GenerationController.reportgenerationEmail
);
routes.get(
  `${apiVersion}/invoicereturn`,

  UsersController.invoiceReturn
);
routes.put(
  `${apiVersion}/updatelogo`,
  checkToken,
  upload.single("image"),
  UsersController.updateLogo
);
routes.get(
  `${apiVersion}/genmonitor`,

  UsersController.genMonitor
);
routes.post(
  `${apiVersion}/invoicereceived`,

  UsersController.InvoiceReceived
);
routes.get(`${apiVersion}/emailalert`, checkToken, UsersController.emailAlert);
routes.post(
  `${apiVersion}/brandinfo`,

  UsersController.brandInformation
);
routes.post(`${apiVersion}/helpcenter`, checkToken, UsersController.helpCenter);
routes.post(
  `${apiVersion}/usealertemail`,
  checkToken,
  UsersController.useAlertEmail
);

routes.post(
  `${apiVersion}/brandupdate`,
  checkToken,
  UsersController.brandCreationUpdate
);
routes.post(
  `${apiVersion}/storereport`,
  checkToken,
  UsersController.storeReport
);
routes.post(`${apiVersion}/invoice`, checkToken, UsersController.Invoice);
routes.post(
  `${apiVersion}/reportcounting`,
  checkToken,
  UsersController.reportCounting
);
routes.post(
  `${apiVersion}/emailpdf`,
  checkToken,
  GenerationController.reportgenerationEmailPDF
);
routes.post(
  `${apiVersion}/updateplants`,
  checkToken,
  UsersController.updatePlants
);
routes.post(
  `${apiVersion}/updateemail`,
  checkToken,
  GenerationController.updateEmail
);
routes.post(
  `${apiVersion}/generalreport`,
  checkToken,
  GenerationController.generalreportEmail
);
routes.get(`${apiVersion}/users`, checkToken, UsersController.users);
routes.get(
  `${apiVersion}/userBrands/:uuid`,
  checkToken,
  UsersController.userBrands
);
routes.get(`${apiVersion}/user/:uuid`, UsersController.show);
routes.post(
  `${apiVersion}/register`,

  UsersController.store
);
routes.get(
  `${apiVersion}/generationandtemperature`,

  GenerationController.deviceDataAndLatestTemperature
);

routes.post(`${apiVersion}/sendingemail`, UsersController.sendEmail);
routes.post(`${apiVersion}/passrecover`, UsersController.passwordRecover);
routes.post(`${apiVersion}/deviceLogin`, checkToken, UsersController.newDevice);
routes.post(
  `${apiVersion}/deleteDevice`,
  checkToken,
  UsersController.deleteDevice
);
routes.get(
  `${apiVersion}/alerts/:devUuid`,
  checkToken,
  GenerationController.recentAlerts
);
routes.get(
  `${apiVersion}/projection`,
  checkToken,
  GenerationController.projection
);
routes.patch(
  `${apiVersion}/projection`,
  checkToken,
  GenerationController.projectionPatch
);
//Não esta sendo usada essa rota
routes.get(
  `${apiVersion}/devices/:bl_uuid`,

  DevicesControlle.index
);
// routes.post(
//   `${apiVersion}/testquery`,

//   GenerationController.testQuery
// );
routes.put(
  `${apiVersion}/alertfrequency`,
  checkToken,
  UsersController.alertFrequencyDefinition
);

routes.put(
  `${apiVersion}/devicerecover`,
  checkToken,
  DevicesControlle.deviceRecover
);

routes.get(
  `${apiVersion}/emailalertsend`,
  checkToken,
  UsersController.emailAlertSend
);

routes.get(
  `${apiVersion}/alertFrequency/:uuid`,

  UsersController.alertFrequency
);
routes.post(
  `${apiVersion}/cancelplan`,
  checkToken,
  UsersController.cancelUserPlan
);
routes.get(
  `${apiVersion}/invoicevalues`,
  checkToken,
  UsersController.invoiceValues
);
routes.post(
  `${apiVersion}/updateuser`,

  UsersController.UpdateUserInformation
);
// routes.post(
//   `${apiVersion}/liquidationreport`,

//   DevicesController.liquidationReport
// );

// routes.post(`${apiVersion}/massemail`, UsersController.massEmail);

//   DevicesController.liquidationReport
// );

routes.post(`${apiVersion}/massemail`, checkToken, UsersController.massEmail);

// routes.get(
//   `${apiVersion}/automaticmassemail`,
//   checkToken,
//   UsersController.automaticmassEmail
// );
routes.post(
  `${apiVersion}/emaildash`,
  checkToken,
  UsersController.portalemailLogins
);
routes.post(
  `${apiVersion}/deviceinfo/:par?`,
  checkToken,
  UsersController.deviceInformation
);
routes.post(
  `${apiVersion}/managernames`,

  DevicesController.managerNames
);
routes.post(
  `${apiVersion}/updateemaildevice`,
  checkToken,
  UsersController.updatedeviceEmail
);
routes.post(
  `${apiVersion}/csvdownload`,
  checkToken,
  UsersController.csvDownload
);
// routes.post(
//   `${apiVersion}/emailscheduler`, //Agendador data de envio relatorio
//   checkToken,
//   UsersController.massemailScheduler
// );

// routes.put(
//   `${apiVersion}/restartcolumn`,
//   checkToken,
//   UsersController.restartdevVerifyColumn
// );

routes.post(
  `${apiVersion}/xlsxportal`,
  upload.single("arquivo"),
  checkToken,
  UsersController.xlsxPortal
);
routes.post(
  `${apiVersion}/bignumbersum`,
  checkToken,
  DevicesControlle.bigNumberSum
);
routes.post(`${apiVersion}/deleteuser`, checkToken, UsersController.deleteUser);
//Api da Tabela
routes.get(
  `${apiVersion}/dashboard/:uuid/:par`,
  checkToken,
  UsersController.dashboard
);
routes.post(
  `${apiVersion}/massiveReportsStatus`,
  checkToken,
  UsersController.massiveReportsStatus
);
// routes.get(
//   `${apiVersion}/dashboardall/:uuid`,
//   checkToken,
//   UsersController.dashboardAll
// );

export default routes;
