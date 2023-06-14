import IrradiationCoefficient from "../models/IrradiationCoefficient";

class IrradiationCoefficientController {

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
