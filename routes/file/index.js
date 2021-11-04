const router = require('express').Router();
const Telegraf = require('telegraf');
const { catchReject } = require('../../utils/helper');

const getFile = catchReject(async (req, res, next) => {
    let bot = new Telegraf(req.params.token);
    let file_link = await bot.telegram.getFileLink(req.params.fileId)
    res.send({
        status: 200,
        file_link
    })
})
router.get('/:token/:fileId', getFile)

module.exports = router;