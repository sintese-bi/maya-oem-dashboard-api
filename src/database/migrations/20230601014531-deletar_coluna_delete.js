'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('status', 'sta_delete');
    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('status', 'sta_delete', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  
  }
};