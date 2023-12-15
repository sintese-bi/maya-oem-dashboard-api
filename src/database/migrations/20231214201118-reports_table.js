"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      "reports", // Nome da tabela
      {
        port_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        port_check: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },

        dev_uuid: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "devices", // nome do modelo de destino
            key: "dev_uuid", // chave no modelo de destino que estamos referenciando
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
        dev_updated_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        schema: "public",
        timestamps: false,
        freezeTableName: true,
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("reports", {
      schema: "public",
    });
  },
};
