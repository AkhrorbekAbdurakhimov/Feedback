require('dotenv').config();
const { on } = require('nodemon');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
    ctx.reply("Assalomu alaykum. Botimizdan foydalanish uchun iltimos ro'yhatdan o'ting.\n\nBuning uchun, xizmat ko'rsatish 🇺🇿 tilini tanlab oling.\n\n\nЗдравствуйте! Чтобы пользоваться нашим ботом вам необходимо пройти регистрацию. \n\nДавайте для начала выберем 🇷🇺 язык обслуживания.", Markup
        .keyboard(["🇺🇿 O'zbekcha", "🇷🇺 Русский"])
        .oneTime()
        .resize()
    )
})


bot.launch();