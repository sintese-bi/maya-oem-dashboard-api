module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("users", "use_cnhrg", {
        type: Sequelize.TEXT,
      }),
      queryInterface.addColumn("users", "use_proof", {
        type: Sequelize.TEXT,
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("users", "use_cnhrg"),
      queryInterface.removeColumn("users", "use_proof"),
    ]);
  },
};
