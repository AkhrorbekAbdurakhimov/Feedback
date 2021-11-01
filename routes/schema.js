const Joi = require('joi');

const botRegisterSchema = Joi.object({
    botToken: Joi.string().required(),
    botPhoto: Joi.string().optional().default(null),
    adminId: Joi.number().required(),
});

const adminRegisterSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    fullName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    profilePhoto: Joi.string().optional().default(null)
})

module.exports = { botRegisterSchema, adminRegisterSchema }