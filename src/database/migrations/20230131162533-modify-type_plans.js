'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('ALTER TABLE type_plans ALTER COLUMN tp_uuid SET DEFAULT gen_random_uuid()') ;

  },

};