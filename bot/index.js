const Promise = require('bluebird');
const Bot = require('./../database');
const { botStart } = require('./bot.start')

const runBots = async () => {
    let tokens = await Bot.getBotTokens();
    
    await Promise.map(tokens, async (token) => {
        await botStart(token.bot_token)
    })
}

module.exports = { runBots }