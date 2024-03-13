import { Model, DataTypes } from "sequelize";
import Devices from "./Devices";
class Generation extends Model {
  static init(sequelize) {
    super.init(
      {
        gen_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        gen_estimated: {
          type: DataTypes.FLOAT,
          get: function () {
            return (
              this.getDataValue("gen_estimated") &&
              this.getDataValue("gen_estimated").toFixed(2) * 1
            );
          },
        },
        gen_real: {
          type: DataTypes.FLOAT,
        },
        gen_date: {
          type: DataTypes.STRING,
        },
        dev_uuid: {
          type: DataTypes.UUID,
        },
        gen_created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        gen_updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        // gen_projection: {
        //   type: DataTypes.FLOAT,
        // },
        // gen_percentage: {
        //   type: DataTypes.FLOAT,
        // },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "generation", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }
  static associate(models) {
    this.belongsTo(models.Devices, {
      foreignKey: "dev_uuid",
      as: "devices",
    });
  }
}

export default Generation;
