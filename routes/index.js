const router = require('express').Router();
const { catchReject } = require('./../utils/helper')
const { botRegisterSchema } = require('./schema')
const Bot = require('./../database')

const botRegister = catchReject(async (req, res, next) => {
    const { error, value } = botRegisterSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
    
    let bot_details = [
        value.bot_token,
    ]
    await Bot.registerBot(bot_details)
    res.send({
        status: 200,
        message: "Your bot successfully inserted"
    })
})

router.use('/bot/register', botRegister);

module.exports = router;