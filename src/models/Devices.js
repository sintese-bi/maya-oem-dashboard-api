import { Model, DataTypes } from "sequelize";

class Devices extends Model {
  static init(sequelize) {
    super.init(
      {
        dev_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        dev_name: {
          type: DataTypes.STRING,
        },
        dev_contract_name: {
          type: DataTypes.STRING,
        },
        dev_brand: {
          type: DataTypes.STRING,
        },
        dev_address: {
          type: DataTypes.STRING,
        },
        dev_capacity: {
          type: DataTypes.FLOAT,
        },
        sta_uuid: { type: DataTypes.UUIDV4 },
        bl_uuid: { type: DataTypes.UUIDV4 },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "devices", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.Generation, {
      foreignKey: "dev_uuid",
      as: "generation",
    });
    this.hasMany(models.Alerts, {
      foreignKey: "dev_uuid",
      as: "alerts",
    });
    this.hasMany(models.Temperature, {
      foreignKey: "dev_uuid",
      as: "temperature",
    });
    this.belongsTo(models.Status, {
      foreignKey: "sta_uuid",
      as: "status",
    });
  }
}

export default Devices;
