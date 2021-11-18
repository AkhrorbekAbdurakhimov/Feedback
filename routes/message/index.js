const router = require('express').Router();
const { catchReject } = require('../../utils/helper');
const Bot = require('../../database');

const getMessages = catchReject(async (req, res, next) => {
    let messages = await Bot.getMessages(req.query)
    res.send({
        status: 200,
        data: messages
    })
})

const sendMessage = catchReject(async (req, res, next) => {
    res.send({
        status: 200,
        message: 'message send successfully'
    })
})

router.use('/send-message', sendMessage);
router.get('/get-messages', getMessages);

module.exports = router;