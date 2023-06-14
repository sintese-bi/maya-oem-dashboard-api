"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE status ALTER COLUMN sta_uuid SET DEFAULT gen_random_uuid()"
    );
  },
};
