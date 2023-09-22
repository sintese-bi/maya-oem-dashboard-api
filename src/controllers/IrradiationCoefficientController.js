import IrradiationCoefficient from "../models/IrradiationCoefficient";

class IrradiationCoefficientController {
  //Esta função assíncrona trata de uma requisição para recuperar todos os registros da tabela "IrradiationCoefficient".
  async index(req, res) {
    try {
      const data = await IrradiationCoefficient.findAll();
      return res.json(data);
    } catch (error) {
      res.status(400).json({ message: `Erro ao retornar os dados. ${error}` });
    }
  }
}

export default new IrradiationCoefficientController();
