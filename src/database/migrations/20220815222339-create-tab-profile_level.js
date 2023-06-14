"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "profile_level",
        timestamps: false,
        freezeTableName: true,
      },
      {
        pl_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        pl_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        pl_cod: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        // Timestamps
        pl_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        pl_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("profile_level", {
      schema: "public",
    });
  },
};
