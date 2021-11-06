const Joi = require('joi');

const adminRegisterSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    fullName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    profilePhoto: Joi.string().optional().default(null)
})

const adminLoginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
})

module.exports = { adminRegisterSchema, adminLoginSchema }