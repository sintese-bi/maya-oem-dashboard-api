"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE address ALTER COLUMN add_uuid SET DEFAULT gen_random_uuid()"
    );
  },
};
