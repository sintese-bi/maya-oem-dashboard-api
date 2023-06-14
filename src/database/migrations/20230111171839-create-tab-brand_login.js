"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "brand_login",
        timestamps: false,
        freezeTableName: true,
      },
      {
        bl_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        bl_name: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        bl_login: {
          type: Sequelize.STRING(25),
          allowNull: false,
        },
        bl_password: {
          type: Sequelize.STRING(25),
          allowNull: false,
        },
        bl_inverter_numbers: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        bl_wifi: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        use_uuid: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "users", // name of Target model
            key: "use_uuid", // key in Target model that we're referencing
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },

        // Timestamps
        bl_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        bl_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("brand_login", {
      schema: "public",
    });
  },
};
