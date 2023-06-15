import { Model, DataTypes } from "sequelize";

class Generation extends Model {
  static init(sequelize) {
    super.init(
      {
        gen_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        gen_estimated: {
          type: DataTypes.FLOAT,
          get: function () {
            return this.getDataValue('gen_estimated') && this.getDataValue('gen_estimated').toFixed(2) * 1
          }
        },
        gen_real: {
          type: DataTypes.FLOAT,
        },
        gen_date: {
          type: DataTypes.DATE,
        },
        dev_uuid: {
          type: DataTypes.UUID,
        },
        // gen_projection: {
        //   type: DataTypes.FLOAT,
        // },
        // gen_percentage: {
        //   type: DataTypes.FLOAT,
        // },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "generation", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }
}

export default Generation;
