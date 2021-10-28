const router = require('express').Router();
const { catchReject } = require('./../utils/helper')
const { botRegisterSchema } = require('./schema')

const botRegister = catchReject(async (req, res, next) => {
    const { error, value } = botRegisterSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
    
})

router.use('/bot/register', botRegister);

module.exports = router;