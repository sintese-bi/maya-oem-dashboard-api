import { Model, DataTypes } from "sequelize";
import Invoice from "../models/Invoice";
class Invoice_Received extends Model {
  static init(sequelize) {
    super.init(
      {
        ir_uuid: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        ir_periodo: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_modalidade: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        ir_instalacao: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_quota: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_postoHorario: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        ir_qtdConsumo: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdGeracao: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdCompensacao: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdSaldoAnt: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdTransferencia: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdRecebimento: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdSaldoAtual: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_valorKWH: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        dev_uuid: { type: DataTypes.UUIDV4 },
        ir_created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        ir_updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        schema: "public",
        freezeTableName: true,
        tableName: "invoice_received",
        timestamps: true,
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Invoice, {
      foreignKey: "voice_uuid",
      targetKey: "voice_uuid",
      as: "invoice_received",
      onDelete: "CASCADE",
    });
  }
}

export default Invoice_Received;
