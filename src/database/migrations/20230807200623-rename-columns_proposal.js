"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("proposal", "pl_created_at");
    await queryInterface.removeColumn("proposal", "pl_updated_at");

    await queryInterface.addColumn("proposal", "prop_created_at", {
      allowNull: false,
      type: Sequelize.DATE,
    });

    await queryInterface.addColumn("proposal", "prop_updated_at", {
      allowNull: false,
      type: Sequelize.DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("proposal", "pl_created_at", {
      allowNull: false,
      type: Sequelize.DATE,
    });

    await queryInterface.addColumn("proposal", "pl_updated_at", {
      allowNull: false,
      type: Sequelize.DATE,
    });

    await queryInterface.removeColumn("proposal", "prop_created_at");
    await queryInterface.removeColumn("proposal", "prop_updated_at");
  },
};
