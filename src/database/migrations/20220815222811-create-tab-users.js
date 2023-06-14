"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "users",
        timestamps: false,
        freezeTableName: true,
      },
      {
        use_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        use_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        use_email: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        use_password: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        pl_uuid: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "profile_level", // name of Target model
            key: "pl_uuid", // key in Target model that we're referencing
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },

        // Timestamps
        use_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        use_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("users", {
      schema: "public",
    });
  },
};
