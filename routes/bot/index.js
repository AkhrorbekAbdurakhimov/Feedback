const axios = require('axios');
const router = require('express').Router();
const { catchReject } = require('../../utils/helper');
const { botRegisterSchema } = require('./schema');
const Bot = require('../../database');

const getBotId = async (token) => (await axios.get(`https://api.telegram.org/bot${token}/getMe`)).data


const botRegister = catchReject(async (req, res, next) => {
    const { error, value } = botRegisterSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
        
    let data = await Bot.getToken(value.token)
    if (data.length) 
        return next({
            status: 406,
            message: 'This bot is already registered'
        })
    
    const botId = (await getBotId(value.token)).result.id
    await Bot.registerBot([botId, value.token])
    await Bot.insertAdminBots([value.adminId, botId])
    res.send({
        status: 200,
        message: "Your bot successfully inserted"
    })
    next()
})

router.post('/register', botRegister);

module.exports = router;