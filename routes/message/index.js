const router = require('express').Router();
const { catchReject } = require('../../utils/helper');
const Bot = require('../../database');

const getMessages = catchReject(async (req, res, next) => {
    const botId = req.params.botId
    let messages = await Bot.getMessages(botId)
    res.send({
        status: 200,
        data: messages
    })
})

const sendMessage = catchReject(async (req, res, next) => {
    res.send({
        status: 200
    })
})

router.use('/send-message', sendMessage);
router.get('/get-messages/:botId', getMessages);

module.exports = router;