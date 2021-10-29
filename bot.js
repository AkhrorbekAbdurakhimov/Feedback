require('dotenv').config();
const { on } = require('nodemon');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const WizardScene = require('telegraf/scenes/wizard')
const Scene = require('telegraf/scenes/base')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())


const { enter, leave } = Stage

// User Info Scene

const userInfoWizard = new WizardScene('user-info', 
  (ctx) => {
    ctx.reply('Ism Familiyangizni kiriting.\n\nNamuna: Behruz Sarvarov');
    ctx.wizard.state.userInfo = {};
    ctx.wizard.state.userInfo.id = ctx.message.from.id;
    return ctx.wizard.next();
  },
  (ctx) => {
    // validation example
    if (ctx.message.text.length < 4) {
      ctx.reply('Iltimos, Ism Familiyangizni tog`ri kiriting');
      return; 
    }
    ctx.wizard.state.userInfo.name = ctx.message.text;
    ctx.reply('Telefon raqamingiz', Extra.markup((markup) => {
      return markup.resize()
        .keyboard([
          markup.contactRequestButton('Telefon raqam yuborish'),
          
      ])
    
    }))
    
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.userInfo.contact = ctx.message.contact.phone_number;
    ctx.wizard.state.userInfo.created_at = ctx.message.date;
    ctx.wizard.state.userInfo.bot_id = ctx.message.reply_
    ctx.reply(ctx.message)
  }


)





// const nameScene = new Scene('name');
// nameScene.enter((ctx) => ctx.reply('Ism Familiyangizni kiriting.\n\nNamuna: Behruz Sarvarov'))
// nameScene.on('text', (ctx) => {
//     ctx.state.id = ctx.message.from.id;
//     ctx.state.name = ctx.message.text;

    // ctx.reply('Telefon raqamingiz', Extra.markup((markup) => {
    //     return markup.resize()
    //       .keyboard([
    //         markup.contactRequestButton('Telefon raqam yuborish'),
            
    //     ])
      
    // }))
    
//     console.log(ctx.state);
// })
  
// nameScene.on('contact', (ctx) => {
//     ctx.state.contact = ctx.message.contact.phone_number;
//     //console.log(ctx.message);
//     console.log(ctx.state);
// })


//nameScene.leave((ctx) => ctx.scene.enter('phone'));



const stage = new Stage([userInfoWizard], { ttl: 10 })
bot.use(stage.middleware())

bot.start((ctx) => {
    ctx.reply("Assalomu alaykum. Botimizdan foydalanish uchun iltimos ro'yhatdan o'ting.\n\nBuning uchun, xizmat ko'rsatish 🇺🇿 tilini tanlab oling.\n\n\nЗдравствуйте! Чтобы пользоваться нашим ботом вам необходимо пройти регистрацию. \n\nДавайте для начала выберем 🇷🇺 язык обслуживания.", Extra.markup((markup) => {
        return markup.resize()
          .keyboard([
            ['🇺🇿 O`zbekcha', '🇷🇺 Русский']
          ])
      })
    )

    ctx.scene.enter('user-info');
})

bot.launch();