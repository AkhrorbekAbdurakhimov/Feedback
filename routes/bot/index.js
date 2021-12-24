const axios = require('axios');
const router = require('express').Router();
const { catchReject } = require('../../utils/helper');
const { botRegisterSchema } = require('./schema');
const Bot = require('../../database');

const getBot = async (token) => (await axios.get(`https://api.telegram.org/bot${token}/getMe`)).data.result


const botRegister = catchReject(async (req, res, next) => {
    const { error, value } = botRegisterSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
        
    let data = await Bot.getBotsByToken(value.token)
    if (data.length) 
        return next({
            status: 406,
            message: 'This bot is already registered'
        })
    
    const details = await getBot(value.token)
    details.username = '@' + details.username
    await Bot.registerBot([details.id, details.first_name, details.username, value.token])
    await Bot.insertAdminBots([value.adminId, details.id])
    res.send({
        status: 200,
        message: "Your bot successfully inserted"
    })
    next()
})

const getBotUsers = catchReject(async (req, res, next) => {
    let botId = req.params.botId
    let users = await Bot.getUsers(botId)
    res.send({
        status: 200,
        data: users
    })
})

const getAdmin = catchReject(async (req, res, next) => {
    const adminId = req.params.id;
    const admin = await Bot.getAdminInfo(adminId);

    res.send(admin);
})

router.post('/register', botRegister);
router.get('/get-bot-users/:botId', getBotUsers);
router.get('/admin/:id', getAdmin);

module.exports = router;