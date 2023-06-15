module.exports = {
  up(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("users", "use_inverter_numbers"),
      queryInterface.removeColumn("users", "use_module"),
      queryInterface.addColumn("users", "use_module_numbers", {
        type: Sequelize.FLOAT,
      }),
    ]);
  },
};
