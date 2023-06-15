'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "devices",
        timestamps: false,
        freezeTableName: true,
      },
      {
        dev_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        dev_name: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dev_contract_name: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dev_brand: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dev_address: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dev_capacity: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        
        // Timestamps
        dev_created_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        dev_updated_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('devices', {
      schema: 'public'
    })
  }
};