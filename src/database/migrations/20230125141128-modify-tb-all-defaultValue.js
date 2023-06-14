'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryInterface.sequelize.query('ALTER TABLE brand_login ALTER COLUMN bl_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE city_with_population_over_100000 ALTER COLUMN cpo_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE devices ALTER COLUMN dev_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE generation ALTER COLUMN gen_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE irradiation_coefficient ALTER COLUMN ic_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE profile_level ALTER COLUMN pl_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE type_plants ALTER COLUMN tp_uuid SET DEFAULT gen_random_uuid()') ;
    await queryInterface.sequelize.query('ALTER TABLE users ALTER COLUMN use_uuid SET DEFAULT gen_random_uuid()') ;

  },

};