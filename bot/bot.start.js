const { Telegraf, Markup } = require('telegraf');

const botStart = async (token) => {
    const bot = new Telegraf(token)
    
    bot.start(ctx => {
        return ctx.reply(`Xush Kelibsiz`)
    })
    
    bot.launch()
}

module.exports = { botStart }