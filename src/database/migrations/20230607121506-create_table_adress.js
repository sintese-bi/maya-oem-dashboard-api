"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "adress",
        timestamps: true,
        freezeTableName: true,
      },
      {
        add_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        add_type: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        add_street: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        add_neighborhood: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        add_number: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        add_complement: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        add_cep: {
          type: Sequelize.STRING(15),
          allowNull: true,
        },

        use_uuid: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "users",
            key: "use_uuid",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        // Timestamps
        add_created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        add_updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("adress", {
      schema: "public",
    });
  },
};
