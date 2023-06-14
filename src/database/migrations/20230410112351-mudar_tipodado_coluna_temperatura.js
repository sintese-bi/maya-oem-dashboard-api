module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE temperature
      ALTER COLUMN temp_temperature TYPE FLOAT8 USING temp_temperature::float8
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE temperature
      ALTER COLUMN temp_percentage TYPE FLOAT8 USING temp_percentage::float8
    `);

    await queryInterface.changeColumn("temperature", "temp_temperature", {
      type: Sequelize.FLOAT,
      allowNull: false,
    });
    await queryInterface.changeColumn("temperature", "temp_percentage", {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE temperature
      ALTER COLUMN temp_temperature TYPE UUID USING temp_temperature::uuid
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE temperature
      ALTER COLUMN temp_percentage TYPE UUID USING temp_percentage::uuid
    `);

    await queryInterface.changeColumn("temperature", "temp_temperature", {
      type: Sequelize.UUID,
      allowNull: false,
    });
    await queryInterface.changeColumn("temperature", "temp_percentage", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },
};
