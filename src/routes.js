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
const upload = multer({ dest: "uploads/" }); // Define a pasta onde os arquivos serão armazenados

// STADOS DE CONTROLLER
const apiVersion = "/v1";
const routes = express.Router();

// ----------------------------------------------------------------------------
// ROTAS SEM AUTENTICAÇÃO

routes.post(`${apiVersion}/genrealday`, DevicesControlle.sumGeneration);
routes.post(`${apiVersion}/login`, UsersController.login);
routes.post(
  `${apiVersion}/stripe-webhook`,
  StripeController.handleStripeWebhook
);
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

routes.get(`${apiVersion}/report/:blUuid`, UsersController.report);
routes.get(`${apiVersion}/reportclient/:devUuid`, UsersController.reportClient);
// ----------------------------------------------------------------------------
// ROTAS COM AUTENTICAÇÃO
routes.post(
  `${apiVersion}/sendgenerationemail`,
  checkToken,
  GenerationController.reportgenerationEmail
);

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

  UsersController.updatePlants
);
routes.post(
  `${apiVersion}/updateemail`,
  checkToken,
  GenerationController.updateEmail
);
routes.post(
  `${apiVersion}/generalreport`,

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
routes.post(`${apiVersion}/devicelogin`, checkToken,UsersController.newDevice);
routes.post(`${apiVersion}/updatebrands`, checkToken, UsersController.updateBrands);
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
); // NAO TA SENDO USADA
routes.get(
  `${apiVersion}/devices/:bl_uuid`,

  DevicesControlle.index
);
routes.patch(
  `${apiVersion}/alertFrequency`,
  UsersController.patchAlertFrequency
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
routes.post(
  `${apiVersion}/updateuser`,
  checkToken,
  UsersController.UpdateUserInformation
);
routes.post(`${apiVersion}/massemail`, checkToken, UsersController.massEmail);
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
  `${apiVersion}/updateemaildevice`,
  checkToken,
  UsersController.updatedeviceEmail
);
routes.post(
  `${apiVersion}/csvdownload`,
  checkToken,
  UsersController.csvDownload
);
routes.post(
  `${apiVersion}/bignumbersum`,
  checkToken,
  DevicesControlle.bigNumberSum
);
routes.post(`${apiVersion}/deleteuser`, checkToken, UsersController.deleteUser);
//Api da Tabela
routes.get(
  `${apiVersion}/dashboard/:uuid/:par?`,
  checkToken,
  UsersController.dashboard
);

export default routes;
