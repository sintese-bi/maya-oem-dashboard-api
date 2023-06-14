module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adiciona a chave estrangeira para a tabela "Brand"
    await queryInterface.addColumn('users', 'sta_uuid', {
      type: Sequelize.UUID,
      references: {
        model: 'status',
        key: 'sta_uuid',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Adiciona a chave estrangeira para a tabela "Devices"
    await queryInterface.addColumn('devices', 'sta_uuid', {
      type: Sequelize.UUID,
      references: {
        model: 'status',
        key: 'sta_uuid',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove a chave estrangeira da tabela "Brand"
    await queryInterface.removeColumn('users', 'sta_uuid');
    
    // Remove a chave estrangeira da tabela "Devices"
    await queryInterface.removeColumn('devices', 'sta_uuid');
  },
};
