require('dotenv').config();
const { on } = require('nodemon');
const path = require('path');
const  Telegraf = require('telegraf');
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

bot.use(i18n.middleware())
bot.use(session())
bot.use()

const { enter, leave } = Stage

// User Info Scene

const userInfoWizard = new WizardScene('user-info', 
  (ctx) => {
    ctx.reply(ctx.i18n.t('name'));
    ctx.wizard.state.userInfo = {};
    ctx.wizard.state.userInfo.id = ctx.message.from.id;
    return ctx.wizard.next();
  },
  (ctx) => {
    // validation example
    if (ctx.message.text.length < 4) {
      ctx.reply(ctx.i18n.t('name_validation'));
      return; 
    }
    ctx.wizard.state.userInfo.name = ctx.message.text;
    ctx.reply(ctx.i18n.t('phone'), Extra.markup((markup) => {
      return markup.resize().oneTime()
        .keyboard([
          markup.contactRequestButton(ctx.i18n.t('phone_btn')), 
      ])
    
    }))
    
    return ctx.wizard.next();
  },
  async (ctx) => {
    console.log(r);
    ctx.wizard.state.userInfo.contact = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
    ctx.wizard.state.userInfo.created_at = ctx.message.date;
    //ctx.wizard.state.userInfo.bot_id = ctx.message.reply_to_message
  }
)

const stage = new Stage([userInfoWizard], { ttl: 10 })
bot.use(stage.middleware())

bot.start((ctx) => {
    ctx.reply("Assalomu alaykum. Botimizdan foydalanish uchun iltimos ro'yhatdan o'ting.\n\nBuning uchun, xizmat ko'rsatish 🇺🇿 tilini tanlab oling.\n\n\nЗдравствуйте! Чтобы пользоваться нашим ботом вам необходимо пройти регистрацию. \n\nДавайте для начала выберем 🇷🇺 язык обслуживания.", Extra.markup((markup) => {
       markup.inlineKeyBoard([markup.callBackButton("🇺🇿 O'zbekcha", "#uz"), markup.callBackButton("🇷🇺 Русский", "#ru")])
      })
    )

    ctx.scene.enter('user-info');
})

bot.action('#uz', (ctx) => ctx.i18n.locale('uz'));
bot.action('#ru', (ctx) => ctx.i18n.locale('ru'));

bot.launch();
