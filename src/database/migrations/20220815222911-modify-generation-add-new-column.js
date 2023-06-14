module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("generation", "gen_projection", {
        type: Sequelize.FLOAT,
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("generation", "gen_projection"),
    ]);
  },
};
