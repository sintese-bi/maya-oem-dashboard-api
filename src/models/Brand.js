import { Model, DataTypes } from "sequelize";

class Brand extends Model {
  static init(sequelize) {
    super.init(
      {
        bl_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        bl_name: { type: DataTypes.STRING },
        bl_login: { type: DataTypes.STRING },
        bl_password: { type: DataTypes.STRING },
        bl_url: { type: DataTypes.STRING },
        use_uuid: { type: DataTypes.UUIDV4 },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "brand_login", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.Devices, {
      foreignKey: "bl_uuid",
      as: "devices",
    });
   
  }
}
export default Brand;
