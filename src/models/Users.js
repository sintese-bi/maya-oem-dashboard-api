import { Model, DataTypes } from "sequelize";

class Users extends Model {
  static init(sequelize) {
    super.init(
      {
        use_uuid: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        use_name: { type: DataTypes.STRING },
        use_email: { type: DataTypes.STRING },
        use_password: {
          type: DataTypes.STRING,
          validate: {
            notEmpty: true,
            noSpaces(use_password) {
              if (use_password.includes(" ")) {
                throw new Error("A senha não pode conter espaços");
              }
            },
          },
        },
        pl_uuid: { type: DataTypes.UUIDV4 },
        use_telephone: { type: DataTypes.STRING },
        use_percentage: { type: DataTypes.FLOAT },
        use_frequency_data: { type: DataTypes.DATE },
        use_date: { type: DataTypes.INTEGER },
        use_frequency_name: { type: DataTypes.STRING },
        use_cpf: { type: DataTypes.STRING },
        use_cnpj: { type: DataTypes.STRING },
        use_rg: { type: DataTypes.STRING },
        use_contract_name: { type: DataTypes.STRING },
        use_corporation_name: { type: DataTypes.STRING },
        use_code_pagar_me: { type: DataTypes.STRING },
        use_code_panda_doc: { type: DataTypes.STRING },
        use_city_state: { type: DataTypes.STRING },
        use_type_plan: { type: DataTypes.STRING },
        use_module_numbers: { type: DataTypes.INTEGER },
        use_kwp: { type: DataTypes.FLOAT },
        use_wifi: { type: DataTypes.INTEGER },
        use_type_system: { type: DataTypes.STRING },
        use_type_member: { type: DataTypes.BOOLEAN },
        tp_uuid: { type: DataTypes.UUIDV4 },
        sta_uuid: { type: DataTypes.UUIDV4 },
        use_cnhrg: { type: DataTypes.TEXT, allowNull: true },
        use_proof: { type: DataTypes.TEXT, allowNull: true },
        use_token: { type: DataTypes.TEXT, allowNull: true },
        use_alert_email: { type: DataTypes.STRING },
        use_deleted: { type: DataTypes.BOOLEAN },
        use_logo: { type: DataTypes.TEXT },
        use_date_report: {
          type: DataTypes.STRING,
        },
        use_set_report: { type: DataTypes.BOOLEAN },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true, // mantém o nome da tabela singular
        tableName: "users", // nome da tabela
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    //Definindo as associações entre as tabelas
    //Nesse caso, um usuário pode ter diversas marcas
    this.hasMany(models.Brand, {
      foreignKey: "use_uuid",
      as: "brand_login",
    });

    //Nesse caso, um usuário está associado a um único perfil.
    this.belongsTo(models.ProfileLevel, {
      foreignKey: "pl_uuid",
      as: "profile_level",
    });
    this.belongsTo(models.TypePlans, {
      foreignKey: "tp_uuid",
      as: "type_plans",
    });
  }
}

export default Users;
