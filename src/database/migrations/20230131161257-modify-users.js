module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("users", "tp_uuid", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "type_plans", // name of Target model
          key: "tp_uuid", // key in Target model that we're referencing
        },
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([queryInterface.removeColumn("users", "tp_uuid")]);
  },
};
