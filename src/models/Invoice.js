import { Model, DataTypes } from "sequelize";

class Invoice extends Model {
  static init(sequelize) {
    super.init(
      {
        voice_uuid: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        voice_login: {
          type: DataTypes.STRING,
        },
        voice_password: {
          type: DataTypes.STRING,
        },
        voice_install: {
          type: DataTypes.STRING,
        },
        voice_client: {
          type: DataTypes.STRING,
        },
        voice_company: {
          type: DataTypes.STRING,
        },
        use_uuid: { type: DataTypes.UUIDV4 },
        voice_created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        update_created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "invoice",
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Users, {
      foreignKey: "use_uuid",
      as: "users",
    });
  }
}

export default Invoice;
