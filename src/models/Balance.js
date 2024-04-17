import { Model, DataTypes } from "sequelize";

class Balance extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        usina_id: {
          type: DataTypes.BIGINT,
        },
        periodo: {
          type: DataTypes.STRING,
        },
        modalidade: {
          type: DataTypes.STRING,
        },
        instalacao: {
          type: DataTypes.STRING,
        },
        quota: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        postoHorario: {
          type: DataTypes.ENUM("FORAP", "PONTA"),
          allowNull: false,
        },
        qtdConsumo: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        qtdGeracao: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        qtdCompensacao: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        qtdSaldoAnt: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        qtdTransferencia: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        qtdRecebimento: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        qtdSaldoAtual: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
        saldoAntCalculado: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        saldoAtualCalculado: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        ofertaEnergia: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        compensacaoDestaUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        compensacaoComSaldoDestaUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        extraviadaDestaUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        compensacaoOutraUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        compensacaoComSaldoOutraUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        recebimentoOutraUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        saldoAntOutraUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        saldoAtualOutraUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        extraviadaOutraUg: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        saldoAtualTotal: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        isPrimeiroMes: {
          type: DataTypes.INTEGER,
          defaultValue: null,
        },
        isUltimoMesExclusao: {
          type: DataTypes.INTEGER,
          defaultValue: null,
        },
        cobranca: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        recebido: {
          type: DataTypes.FLOAT,
          defaultValue: null,
        },
        dev_uuid: {
          type: DataTypes.UUID,
        },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "saldo_g_d",
        timestamps: false,
      }
    );
    return this;
  }
  static associate(models) {
    this.hasMany(models.Devices, {
      foreignKey: "dev_uuid",
      as: "devices",
    });
  }
}

export default Balance;
