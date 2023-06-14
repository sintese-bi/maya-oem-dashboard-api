"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "type_plans",
        timestamps: false,
        freezeTableName: true,
      },
      {
        tp_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        tp_name: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        tp_description: {
          type: Sequelize.TEXT,
          allowNull: false,
        },

        // Timestamps
        tp_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        tp_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("type_plans", {
      schema: "public",
    });
  },
};
