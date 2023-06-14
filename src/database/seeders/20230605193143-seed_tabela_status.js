module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      {
        schema: "public",
        tableName: "status",
      },
      [
        {
          sta_name: "Online",
          sta_code: "online",
        },
        {
          sta_name: "Offline",
          sta_code: "offline",
        },
        {
          sta_name: "Finalização de cadastro",
          sta_code: "completion_of_registration",
        },
        {
          sta_name: "Em processo",
          sta_code: "in_process",
        },
        {
          sta_name: "Ativo",
          sta_code: "active",
        },
        {
          sta_name: "Aprovado",
          sta_code: "approved",
        },
        {
          sta_name: "Recusado",
          sta_code: "refused",
        },
        {
          sta_name: "Em ajuste",
          sta_code: "in_fit",
        },
        {
          sta_name: "Em análise",
          sta_code: "under_analysis",
        },
        {
          sta_name: "Excluído",
          sta_code: "excluded",
        },
        {
          sta_name: "Aguardando documentação",
          sta_code: "waiting_for_documentation",
        },
        {
          sta_name: "Passo 1",
          sta_code: "step_1",
        },
        {
          sta_name: "Passo 2",
          sta_code: "step_2",
        },
        {
          sta_name: "Passo 3",
          sta_code: "step_3",
        },
        {
          sta_name: "Passo 4",
          sta_code: "step_4",
        },
        {
          sta_name: "Passo 5",
          sta_code: "step_5",
        },
        {
          sta_name: "Passo 6",
          sta_code: "step_6",
        },
        {
          sta_name: "Passo 7",
          sta_code: "step_7",
        },
        {
          sta_name: "Passo 8",
          sta_code: "step_8",
        },
        {
          sta_name: "Passo 9",
          sta_code: "step_9",
        },
        {
          sta_name: "Passo 10",
          sta_code: "step_10",
        },
      ],
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete({
      schema: "public",
      tableName: "status",
    });
  },
};