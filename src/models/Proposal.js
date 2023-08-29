import { Model, DataTypes } from "sequelize";

class Proposal extends Model {
  static init(sequelize) {
    super.init(
      {
        prop_uuid: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        prop_number: {
          type: DataTypes.STRING,
        },
        
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "proposal",
        timestamps: false,
        underscored: true,
      }
    );
    return this;
  }

  static associate(models) {}
}

export default Proposal;
