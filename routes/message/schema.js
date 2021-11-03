const Joi = require('joi');

const botRegisterSchema = Joi.object({
    token: Joi.string().required(),
    adminId: Joi.number().required()
});

module.exports = { botRegisterSchema }