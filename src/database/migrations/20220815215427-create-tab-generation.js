'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      {
        schema: "public",
        tableName: "generation",
        timestamps: false,
        freezeTableName: true,
      },
      {
        gen_uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        gen_estimated: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        gen_real: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        gen_date: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        dev_uuid: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'devices', // name of Target model
            key: 'dev_uuid', // key in Target model that we're referencing
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        
        // Timestamps
        gen_created_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        gen_updated_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
      }
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('generation', {
      schema: 'public'
    })
  }
};