require('dotenv').config();
const { on } = require('nodemon');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())


const { enter, leave } = Stage

// Name Scene
const nameScene = new Scene('name');
nameScene.enter((ctx) => ctx.reply('Ism Familiyangizni kiriting.\n\nNamuna: Behruz Sarvarov'))
nameScene.on('text', (ctx) => {
    ctx.state.id = ctx.message.from.id;
    ctx.state.name = ctx.message.text;

    ctx.reply('Telefon raqamingiz', Extra.markup((markup) => {
        return markup.resize()
          .keyboard([
            markup.contactRequestButton('Telefon raqam yuborish'),
            
        ])
      
    }))

    //console.log(ctx.message)
    
    console.log(ctx.state);
    //ctx.state.contact = ctx.message.contact;
})

  
bot.on('contact', (ctx) => {
    ctx.state.contact = ctx.message.contact.phone_number;
    console.log(ctx.message);
    console.log(ctx.state);
})


//nameScene.leave((ctx) => ctx.scene.enter('phone'));

// Phone Number Scene
const phoneScene = new Scene('phone');
phoneScene.enter((ctx) => ctx.reply('Telefon raqamingiz', Extra.markup((markup) => {
    return markup.resize()
      .keyboard([
        markup.contactRequestButton('Send contact'),
        
      ])
  })
))

const stage = new Stage([nameScene, phoneScene], { ttl: 10 })
bot.use(stage.middleware())

bot.start((ctx) => {
    ctx.reply("Assalomu alaykum. Botimizdan foydalanish uchun iltimos ro'yhatdan o'ting.\n\nBuning uchun, xizmat ko'rsatish 🇺🇿 tilini tanlab oling.\n\n\nЗдравствуйте! Чтобы пользоваться нашим ботом вам необходимо пройти регистрацию. \n\nДавайте для начала выберем 🇷🇺 язык обслуживания.", Extra.markup((markup) => {
        return markup.resize()
          .keyboard([
            ['🇺🇿 O`zbekcha', '🇷🇺 Русский']
          ])
      })
    )

    ctx.scene.enter('name');
})








bot.launch();