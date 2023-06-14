import { Model, DataTypes } from "sequelize";

class Temperature extends Model {
  static init(sequelize) {
    super.init(
      {
        temp_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        temp_date: { type: DataTypes.STRING },
        temp_percentage: { type: DataTypes.FLOAT },
        temp_temperature: { type: DataTypes.FLOAT },
        dev_uuid: { type: DataTypes.UUIDV4 },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "temperature", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.Devices, {
        foreignKey: "dev_uuid",
        as: "devices",
      });
  }
}
export default Temperature;
