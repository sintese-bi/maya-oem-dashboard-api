import { Model, DataTypes } from "sequelize";

class Alerts extends Model {
  static init(sequelize) {
    super.init(
      {
        al_uuid: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        al_alerts: {
          type: DataTypes.STRING,
        },
        al_inv: {
          type: DataTypes.STRING,
        },
        dev_uuid: {
          type: DataTypes.UUID,
          references: {
            model: "brand_login",
            key: "bl_uuid",
          },
          onDelete: "CASCADE",
        },

        alert_created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "alerts",
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.Brand, {
      foreignKey: "bl_uuid",
      as: "brand_login",
    });
    this.hasMany(models.Devices, {
      foreignKey: "dev_uuid",
      as: "devices",
    });
  }
}

export default Alerts;
