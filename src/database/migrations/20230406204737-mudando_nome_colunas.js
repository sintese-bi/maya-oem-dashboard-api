'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // renomeando duas colunas na tabela 'alerts'
    
    await queryInterface.renameColumn('alerts', 'dev_alerts', 'al_alerts');
    await queryInterface.renameColumn('alerts', 'dev_inv', 'al_inv');
    await queryInterface.renameColumn('alerts', 'alerts_uuid', 'al_uuid');
    // renomeando uma coluna na tabela 'temperature'
    await queryInterface.renameColumn('temperature', 'temp_user', 'temp_temperature');
  },

  down: async (queryInterface, Sequelize) => {
    // renomeando as colunas de volta para seus nomes originais
    await queryInterface.renameColumn('alerts', 'al_alerts', 'dev_alerts');
    await queryInterface.renameColumn('alerts', 'al_inv', 'dev_inv');
    await queryInterface.renameColumn('alerts', 'al_uuid', 'alerts_uuid');
    //renomeando para original
    await queryInterface.renameColumn('temperature', 'temp_temperature', 'temp_user');
  }
};