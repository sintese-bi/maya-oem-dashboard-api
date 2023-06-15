"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "use_cpf_cpnj");
    await queryInterface.removeColumn("users", "use_cep");
    await queryInterface.removeColumn("users", "galaxpay_id");
    await queryInterface.removeColumn("users", "galaxpay_hash");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "use_cpf_cpnj", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "use_cep", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "galaxpay_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "galaxpay_hash", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
