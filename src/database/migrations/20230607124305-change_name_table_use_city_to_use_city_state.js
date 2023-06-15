'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'use_city', 'use_city_state');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'use_city_state', 'use_city');
  }
};