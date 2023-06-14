
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      {
        schema: "public",
        tableName: "profile_level",
      },
      [
        {
          pl_name: "Admin",
          pl_cod: 1,
        },
        {
          pl_name: "Controladoria",
          pl_cod: 2,
        },
        {
          pl_name: "Cliente",
          pl_cod: 3,
        },
      ],
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete({
      schema: "public",
      tableName: "profile_level",
    });
  },
};
