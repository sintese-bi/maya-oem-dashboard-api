module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('temperature', 'alert_uuid', 'temp_uuid');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('tableName', 'temp_uuid', 'alert_uuid');
  }
};