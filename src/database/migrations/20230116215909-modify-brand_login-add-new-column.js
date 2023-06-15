module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("brand_login", "bl_url", {
        type: Sequelize.STRING,
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("brand_login", "bl_url"),
    ]);
  },
};
