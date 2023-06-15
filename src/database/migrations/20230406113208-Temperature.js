"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "temperature",
        timestamps: false,
        freezeTableName: true,
      },
      {
        alert_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        temp_user: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        temp_percentage: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        temp_date: {
          type: Sequelize.DATE,
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
        temp_created_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("temperature", {
      schema: "public",
    });
  },
};
