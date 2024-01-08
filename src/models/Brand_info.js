import { Model, DataTypes } from "sequelize";

class Brand_Info extends Model {
  static init(sequelize) {
    super.init(
      { 
        bl_name: { type: DataTypes.STRING },
        bl_url: { type: DataTypes.STRING },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "brand_info", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {}
}
export default Brand_Info;
