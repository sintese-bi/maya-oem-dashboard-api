import { Model, DataTypes } from "sequelize";

class Status extends Model {
  static init(sequelize) {
    super.init(
      {
        sta_uuid: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        sta_code: {
          type: DataTypes.STRING,
        },
        sta_name: {
          type: DataTypes.STRING,
        },
       
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "status",
        timestamps: true,
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.Users, {
      foreignKey: "use_uuid",
      as: "users",
    });
  }
}

export default Status;
