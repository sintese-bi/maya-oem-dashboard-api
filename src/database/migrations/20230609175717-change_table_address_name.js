'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('adress', 'address');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('address', 'adress');
  },
};
