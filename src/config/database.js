//Configuração das credenciais do Banco de Dados

require("dotenv/config");

module.exports = {
  dialect: "postgres",
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  define: {
    timestamps: true,
    underscored: true,
  },
<<<<<<< HEAD
  pool: {
    max: 10, // Número máximo de conexões no pool
    min: 0, // Número mínimo de conexões no pool
    acquire: 20000, // Tempo limite para adquirir uma conexão (em milissegundos)
    idle: 8000, // Tempo máximo que uma conexão pode ficar ociosa antes de ser liberada (em milissegundos)
=======

  pool: {
    max: 10, // Número máximo de conexões no pool
    min: 0, // Número mínimo de conexões no pool
    acquire: 30000, // Tempo limite para adquirir uma conexão (em milissegundos)
    idle: 10000, // Tempo máximo que uma conexão pode ficar ociosa antes de ser liberada (em milissegundos)
>>>>>>> ddd7a93596847f20aced915a400a57b6670e706c
  },
};
