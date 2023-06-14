"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "irradiation_coefficient",
        timestamps: false,
        freezeTableName: true,
      },
      {
        ic_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        ic_lat: { type: Sequelize.INTEGER, defaultValue: Sequelize.UUIDV4 },
        ic_lon: { type: Sequelize.INTEGER, defaultValue: Sequelize.UUIDV4 },
        ic_city: { type: Sequelize.STRING(50), defaultValue: Sequelize.UUIDV4 },
        ic_states: {
          type: Sequelize.STRING(50),
          defaultValue: Sequelize.UUIDV4,
        },
        ic_january: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_february: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_march: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_april: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_may: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_june: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_july: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_august: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_september: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_october: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_november: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_december: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },
        ic_yearly: { type: Sequelize.FLOAT, defaultValue: Sequelize.UUIDV4 },

        // Timestamps
        ic_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        ic_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("irradiation_coefficient", {
      schema: "public",
    });
  },
};
