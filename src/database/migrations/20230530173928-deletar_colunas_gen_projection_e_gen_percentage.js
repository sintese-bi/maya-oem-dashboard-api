'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('generation', 'gen_projection');
    await queryInterface.removeColumn('generation', 'gen_percentage');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('generation', 'gen_projection', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('generation', 'gen_percentage', {
      type: Sequelize.FLOAT,
      
      allowNull: true
    });
  }
};