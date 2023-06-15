module.exports = {
  up(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("brand_login", "bl_inverter_numbers"),
      queryInterface.removeColumn("brand_login", "bl_wifi"),
    ]);
  },
};
