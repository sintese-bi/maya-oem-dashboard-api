import { Model, DataTypes } from "sequelize";

class DeletedDevices extends Model {
  static init(sequelize) {
    super.init(
      {
        dev_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        }
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "deleted_devices", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }
}

export default DeletedDevices;
