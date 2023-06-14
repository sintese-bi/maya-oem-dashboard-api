import { Model, DataTypes } from "sequelize";

class Address extends Model {
  static init(sequelize) {
    super.init(
      {
        add_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        add_type: {
          type: DataTypes.STRING,
        },
        add_street: {
          type: DataTypes.STRING,
        },
        add_neighborhood: {
          type: DataTypes.STRING,
        },
        add_number: {
          type: DataTypes.STRING,
        },
        add_city_state: {
          type: DataTypes.STRING,
        },
        add_complement: {
          type: DataTypes.STRING,
        },
        add_cep: { type: DataTypes.STRING },
        use_uuid: { type: DataTypes.UUIDV4 },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "address", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }
}

export default Address;
