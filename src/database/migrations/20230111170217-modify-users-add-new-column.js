module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("users", "usu_telephone", {
        type: Sequelize.STRING(20),
      }),
      queryInterface.addColumn("users", "usu_city", {
        type: Sequelize.STRING(50),
      }),
      queryInterface.addColumn("users", "usu_cpf_cpnj", {
        type: Sequelize.STRING(20),
      }),
      queryInterface.addColumn("users", "usu_installation_address", {
        type: Sequelize.STRING(200),
      }),
      queryInterface.addColumn("users", "usu_cep", {
        type: Sequelize.STRING(25),
      }),
      queryInterface.addColumn("users", "usu_module", {
        type: Sequelize.INTEGER,
      }),
      queryInterface.addColumn("users", "usu_kwp", {
        type: Sequelize.FLOAT,
      }),
      queryInterface.addColumn("users", "usu_type_system", {
        type: Sequelize.STRING(20),
      }),
      queryInterface.addColumn("users", "tp_uuid", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'type_plants', // name of Target model
          key: 'tp_uuid', // key in Target model that we're referencing
        },
      }),
 
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("users", "linkedin"),
      queryInterface.removeColumn("users", "usu_telephone"),
      queryInterface.removeColumn("users", "usu_city"),
      queryInterface.removeColumn("users", "usu_cpf_cpnj"),
      queryInterface.removeColumn("users", "usu_installation_address"),
      queryInterface.removeColumn("users", "usu_cep"),
      queryInterface.removeColumn("users", "usu_module"),
      queryInterface.removeColumn("users", "usu_kwp"),
      queryInterface.removeColumn("users", "usu_type_system"),
      queryInterface.removeColumn("users", "tp_uuid"),
    ]);
  },
};
