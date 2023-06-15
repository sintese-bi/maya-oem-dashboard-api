'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'use_city_state');
    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'use_city_state', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  
  }
};