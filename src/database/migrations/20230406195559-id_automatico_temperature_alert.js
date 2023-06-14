'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    await queryInterface.sequelize.query('ALTER TABLE alerts ALTER COLUMN alerts_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE temperature ALTER COLUMN temp_uuid SET DEFAULT gen_random_uuid()') ;
  },

};