'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'use_installation_address', 'use_city_state');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'use_city_state', 'use_installation_address');
  }
};