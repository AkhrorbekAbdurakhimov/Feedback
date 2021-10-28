const Joi = require('joi');

const botRegisterSchema = Joi.object({
    bot_token: Joi.string().required(),
    bot_name: Joi.string().required(),
    bot_profile_picture: Joi.string().required(),
    bot_description: Joi.string().required(),
    bot_created_at: Joi.string().required()
});

module.exports = { botRegisterSchema }