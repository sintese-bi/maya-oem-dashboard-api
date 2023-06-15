module.exports = {
  up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("devices", "bl_uuid", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'brand_login', // name of Target model
          key: 'bl_uuid', // key in Target model that we're referencing
        },
      }),
    ]);
  },

  down(queryInterface, Sequelize) {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn("devices", "bl_uuid"),
    ]);
  },
};
