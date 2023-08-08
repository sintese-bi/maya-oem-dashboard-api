'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE proposal ALTER COLUMN prop_uuid SET DEFAULT gen_random_uuid()"
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE proposal ALTER COLUMN prop_uuid DROP DEFAULT"
    );
  }
};
