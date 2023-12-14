import { Model, DataTypes } from "sequelize";

class Reports extends Model {
  static init(sequelize) {
    super.init(
      {
        port_uuid: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        port_check: {
          type: DataTypes.BOOLEAN,
        },

        dev_uuid: {
          type: DataTypes.UUID,
          references: {
            model: "reports",
            key: "port_uuid",
          },
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "reports",
        timestamps: true,
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

export default Reports;
