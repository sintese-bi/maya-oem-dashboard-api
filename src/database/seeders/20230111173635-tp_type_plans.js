
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      {
        schema: "public",
        tableName: "type_plans",
      },
      [
        {
          tp_name: "KILOWATT",
          tp_description: "Monitoramento personalizado e especializado, 24 horas por dia, 7 dias por semana. Monitoramento via software(Exclusividade Maya O & M). Acesse sua área de Login em nosso site. Lá você encontra todos os dados de geração da sua Usina e personaliza alertas de acordo com seu desejo.",
        },
        {
          tp_name: "MEGAWATT",
          tp_description: "Lavagens especializadas, com checagem preventiva e preditiva, que mantêm a integridade e vida útil da sua usina. Usinas limpas, com os cuidados imprescindíveis e feitos de maneira correta, geram em média 30% a mais energia que uma usina sem cuidados específicos. ",
        },
        {
          tp_name: "GIGAWATT",
          tp_description: "Todo plano Megawatt + O melhor para sua usina e para o seu bolso: 4 Lavagens mensais com manutenções preventivas; Seguro All-Risck: ointermediação entre você e as maiores seguradoras do mundo, para seu conforto e segurança contra todos os tipos de danos possíveis; 1 Vitrificação dos módulos por ano: Polimento técnico de seus módulos. O produto aplicado, forma uma película protetora que dificulta o acúmulo de poeiras na superfície. ",
        },
      ],
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete({
      schema: "public",
      tableName: "type_plans",
    });
  },
};
