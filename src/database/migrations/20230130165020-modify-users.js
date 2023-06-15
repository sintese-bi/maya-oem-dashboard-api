'use strict';

module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.renameColumn("users", "usu_telephone", "use_telephone"),
      queryInterface.renameColumn("users", "usu_city", "use_city"),
      queryInterface.renameColumn("users", "usu_cpf_cpnj", "use_cpf_cpnj"),
      queryInterface.renameColumn("users", "usu_installation_address", "use_installation_address"),
      queryInterface.renameColumn("users", "usu_cep", "use_cep"),
      queryInterface.renameColumn("users", "usu_module", "use_module"),
      queryInterface.renameColumn("users", "usu_kwp", "use_kwp"),
      queryInterface.renameColumn("users", "usu_type_system", "use_type_system"),
    ]);
  },
};
