"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "status",
        timestamps: true,
        freezeTableName: true,
      },
      {
        sta_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        sta_code: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        sta_name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        sta_delete: {
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
    await queryInterface.dropTable("status", {
      schema: "public",
    });
  },
};
