module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("brand_login", "bl_type", {
        type: Sequelize.STRING(20),
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("brand_login", "bl_type"),
    ]);
  },
};
