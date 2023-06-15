"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn("users", "use_percentage", {
        type: Sequelize.FLOAT,
        allowNull: true,
      }),
      queryInterface.addColumn("users", "use_frequency_data", {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_frequency_name", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_cpf", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_cnpj", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_rg", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_contract_name", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_corporation_name", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_code_pagar_me", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn("users", "use_code_panda_doc", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn("users", "use_percentage"),
      queryInterface.removeColumn("users", "use_frequency_data"),
      queryInterface.removeColumn("users", "use_frequency_name"),
      queryInterface.removeColumn("users", "use_cpf"),
      queryInterface.removeColumn("users", "use_cnpj"),
      queryInterface.removeColumn("users", "use_rg"),
      queryInterface.removeColumn("users", "use_contract_name"),
      queryInterface.removeColumn("users", "use_corporation_name"),
      queryInterface.removeColumn("users", "use_code_pagar_me"),
      queryInterface.removeColumn("users", "use_code_panda_doc"),
    ]);
  },
};
