'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('devices', 'dev_status');
    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('devices', 'dev_status', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  
  }
};