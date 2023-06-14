"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "city_with_population_over_100000",
        timestamps: false,
        freezeTableName: true,
      },
      {
        cpo_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        cpo_uf: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cpo_city: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cpo_country: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cpo_population: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        cpo_lat: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        cpo_long: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },

        // Timestamps
        cpo_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        cpo_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("city_with_population_over_100000", {
      schema: "public",
    });
  },
};
