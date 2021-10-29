require('dotenv').config();
const { on } = require('nodemon');
const { Telegraf } = require('telegraf');
const TelegrafI18n = require('telegraf-i18n')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const WizardScene = require('telegraf/scenes/wizard')
const Scene = require('telegraf/scenes/base')

const bot = new Telegraf(process.env.BOT_TOKEN)

const i18n = new TelegrafI18n({
  defaultLanguage: 'uz',
  allowMissing: false, // Default true
  directory: path.resolve(__dirname, 'locales'),
  useSession: true,
  sessionName: "session"

})


bot.use(session())
bot.use()


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
      return markup.resize().oneTime()
        .keyboard([
          markup.contactRequestButton('Telefon raqam yuborish'),
          
      ])
    
    }))
    
    return ctx.wizard.next();
  },
  async (ctx) => {
    console.log(r);
    ctx.wizard.state.userInfo.contact = ctx.message.contact.phone_number;
    ctx.wizard.state.userInfo.created_at = ctx.message.date;
    //ctx.wizard.state.userInfo.bot_id = ctx.message.reply_to_message
  }
)

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