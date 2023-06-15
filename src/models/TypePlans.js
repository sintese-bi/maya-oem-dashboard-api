import { Model, DataTypes } from "sequelize";


class TypePlans extends Model {
  static init(sequelize) {
    super.init(
      {
        tp_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        tp_name: { type: DataTypes.STRING },
        tp_description: { type: DataTypes.STRING },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "type_plans", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {}
}
export default TypePlans;
