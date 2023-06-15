module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("users", "use_inverter_numbers", {
        type: Sequelize.INTEGER,
      }),
      queryInterface.addColumn("users", "use_wifi", {
        type: Sequelize.BOOLEAN,
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("users", "use_inverter_numbers"),
      queryInterface.removeColumn("users", "use_wifi"),
    ]);
  },
};
