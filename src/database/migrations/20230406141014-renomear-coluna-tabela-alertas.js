module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('alerts', 'dev_created_at', 'alert_created_at');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('alerts', 'alert_created_at', 'dev_created_at');
  }
};