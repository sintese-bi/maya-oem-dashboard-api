"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "proposal",
        timestamps: false,
        freezeTableName: true,
      },
      {
        prop_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        prop_number: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        
        // Timestamps
        prop_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        prop_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("proposal", {
      schema: "public",
    });
  },
};
