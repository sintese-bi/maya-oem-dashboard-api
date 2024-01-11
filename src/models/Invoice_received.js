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
        ir_postohorario: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        ir_qtdconsumo: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdgeracao: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdcompensacao: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdsaldoant: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdtransferencia: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdrecebimento: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_qtdsaldoatual: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        ir_valorkwh: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        voice_uuid: { type: DataTypes.UUIDV4 },
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
        timestamps: false,
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.Invoice, {
      foreignKey: "voice_uuid",
      as: "invoice",
    });
  }
}

export default Invoice_Received;
