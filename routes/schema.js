const Joi = require('joi');

const botRegisterSchema = Joi.object({
    bot_token: Joi.string().required()
});

module.exports = { botRegisterSchema }