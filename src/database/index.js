import { Sequelize } from "sequelize";
import dbConfig from "../config/database";
import Users from "../models/Users";
import Devices from "../models/Devices";
import Generation from "../models/Generation";
import IrradiationCoefficient from "../models/IrradiationCoefficient";
import Brand from "../models/Brand";
import ProfileLevel from "../models/ProfileLevel";
import TypePlans from "../models/TypePlans";
import Alerts from "../models/Alerts";
import Temperature from "../models/Temperature";
import Status from "../models/Status";
import Invoice from "../models/Invoice";
import Brand_Info from "../models/Brand_info";
import Address from "../models/Address";
import Invoice_received from "../models/Invoice_received";
import Proposal from "../models/Proposal";
import DeletedDevices from "../models/DeletedDevices";
import Reports from "../models/Reports";

const modelsDbMayaEnergy = [
  Temperature,
  Brand_Info,
  Alerts,
  Address,
  Proposal,
  Reports,
  Invoice_received,
  TypePlans,
  ProfileLevel,
  Invoice,
  Brand,
  Status,
  Users,
  Devices,
  Generation,
  IrradiationCoefficient,
  DeletedDevices,
];

class Database {
  constructor() {
    this.init();
  }

  init() {
    // models para o banco
    const dbMayaEnergy = new Sequelize(dbConfig);
    modelsDbMayaEnergy
      .map((model) => model.init(dbMayaEnergy))
      .map((model) => {
        if (model.associate) model.associate(dbMayaEnergy.models);
        return model;
      });
  }
}

export default new Database();
