import { Model, DataTypes } from "sequelize";

class ProfileLevel extends Model {
  static init(sequelize) {
    super.init(
      {
        pl_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        pl_name: { type: DataTypes.STRING },
        pl_cod: { type: DataTypes.STRING },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "profile_level", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {}
}
export default ProfileLevel;
