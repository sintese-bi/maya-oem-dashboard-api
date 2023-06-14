"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "alerts",
        timestamps: false,
        freezeTableName: true,
      },
      {
        alerts_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        dev_alerts: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dev_inv: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dev_uuid: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "devices", // name of Target model
            key: "dev_uuid", // key in Target model that we're referencing
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },

        // Timestamps
        dev_created_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("alerts", {
      schema: "public",
    });
  },
};
