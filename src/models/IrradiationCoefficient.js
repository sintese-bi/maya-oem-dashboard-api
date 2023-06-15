import { Model, DataTypes } from "sequelize";

class IrradiationCoefficient extends Model {
  static init(sequelize) {
    super.init(
      {
        ic_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        ic_city: {
          type: DataTypes.STRING,
        },
        ic_states: {
          type: DataTypes.STRING,
        },
        ic_lat: {
          type: DataTypes.NUMBER,
        },
        ic_lon: {
          type: DataTypes.NUMBER,
        },
        ic_january: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_january") &&
              this.getDataValue("ic_january").toFixed(3) * 1
            );
          },
        },
        ic_february: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_february") &&
              this.getDataValue("ic_february").toFixed(3) * 1
            );
          },
        },
        ic_march: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_march") &&
              this.getDataValue("ic_march").toFixed(3) * 1
            );
          },
        },
        ic_april: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_april") &&
              this.getDataValue("ic_april").toFixed(3) * 1
            );
          },
        },
        ic_may: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_may") &&
              this.getDataValue("ic_may").toFixed(3) * 1
            );
          },
        },
        ic_june: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_june") &&
              this.getDataValue("ic_june").toFixed(3) * 1
            );
          },
        },
        ic_july: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_july") &&
              this.getDataValue("ic_july").toFixed(3) * 1
            );
          },
        },
        ic_august: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_august") &&
              this.getDataValue("ic_august").toFixed(3) * 1
            );
          },
        },
        ic_september: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_september") &&
              this.getDataValue("ic_september").toFixed(3) * 1
            );
          },
        },
        ic_october: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_october") &&
              this.getDataValue("ic_october").toFixed(3) * 1
            );
          },
        },
        ic_november: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_november") &&
              this.getDataValue("ic_november").toFixed(3) * 1
            );
          },
        },
        ic_december: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_december") &&
              this.getDataValue("ic_december").toFixed(3) * 1
            );
          },
        },
        ic_yearly: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("ic_yearly") &&
              this.getDataValue("ic_yearly").toFixed(3) * 1
            );
          },
        },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "irradiation_coefficient", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }
}

export default IrradiationCoefficient;
