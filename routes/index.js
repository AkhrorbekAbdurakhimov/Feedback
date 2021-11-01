const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = require('express').Router();
const { catchReject } = require('./../utils/helper');
const { botRegisterSchema, adminRegisterSchema } = require('./schema');
const Bot = require('./../database');
const bot = require('./../bot/config.js')

const getBotInfo = async (token) => (await axios.get(`https://api.telegram.org/bot${token}/getMe`)).data

const botRegister = catchReject(async (req, res, next) => {
    const { error, value } = botRegisterSchema.validate(req.body)
    
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
    
    res.send({
        status: 200,
        message: "Your bot successfully inserted"
    })
})

const getMessages = catchReject(async (req, res, next) => {
    const botId = req.params.botId
    let messages = await Bot.getMessages(botId)
    res.send({
        status: 200,
        data: messages
    })
})

const registerAdmin = catchReject(async (req, res, next) => {
    const { error, value } = adminRegisterSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
        
    let avatarUuid = null;
    if (value.profilePhoto) {
        avatarUuid = `${uuidv4()}.jpg`;
        value.profilePhoto = value.profilePhoto.replace(/^data:image\/jpeg;base64,/, '').replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(path.join(process.cwd(), 'profiles', avatarUuid), value.profilePhoto, 'base64');
    }
    
    let adminDetails = [
        value.username,
        value.password,
        value.fullName,
        value.phoneNumber,
        avatarUuid
    ]
    
    let admin = await Bot.registerAdmin(adminDetails)
    
    res.send({
        status: 200,
        data: admin
    })
})

router.use('/bot/register', botRegister);
// router.use('/bot/set-photo', setChatPhoto);
router.use('/bot/get-messages/:botId', getMessages);
router.use('/auth/register', registerAdmin)

module.exports = router;