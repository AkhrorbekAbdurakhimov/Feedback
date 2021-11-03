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

const Bot = require('./database/index');

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

const about = async () => {
  const result = await bot.telegram.getMe();
  return result.id;
}

// User Info Scene

const userInfoWizard = new WizardScene('user-info', 
  (ctx) => {
    ctx.reply(ctx.i18n.t('name.full-name'));
    // Initialize 'userInfo' object to store data about user
    ctx.wizard.state.userInfo = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    // Name Validation
    if (ctx.message.text.length < 5) {
      ctx.reply(ctx.i18n.t('name.name-validation'));
      return; 
    }
    ctx.wizard.state.userInfo.id = ctx.message.from.id;
    ctx.wizard.state.userInfo.fullName = ctx.message.text;
    ctx.reply(ctx.i18n.t('phone.phone-number'), Extra.markup((markup) => {
      return markup.resize().oneTime()
        .keyboard([
          markup.contactRequestButton(ctx.i18n.t('phone.phone-btn')), 
      ])
    }))
    
    return ctx.wizard.next();
  },
  async (ctx) => {
    // if (!(ctx.message.contact || ctx.message.text)) {
    //   return ctx.reply(ctx.i18n.t('phone.phone-validation'))
    // }
    ctx.wizard.state.userInfo.phoneNumber = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
    const date = new Date(ctx.message.date * 1000);
    ctx.wizard.state.userInfo.createdAt = date;
    ctx.wizard.state.userInfo.botId = await about();
    const { id, fullName, phoneNumber, createdAt, botId } = ctx.wizaed.state.userInfo;
    console.log(id, fullName, phoneNumber, createdAt, botId);
    const result = await Bot.insertUser(id, fullName, phoneNumber, createdAt, botId);
    console.log(result)
    //ctx.reply(ctx.wizard.state.userInfo);
    ctx.reply("Savolingizni yo'llashingiz mumkin.");
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.reply()
    return ctx.scene.leave();
  }
  
)

const stage = new Stage([userInfoWizard], { ttl: 10 })
bot.use(stage.middleware())

bot.start((ctx) => {
    ctx.reply("Assalomu alaykum. Botimizdan foydalanish uchun iltimos ro'yhatdan o'ting.\n\nBuning uchun, xizmat ko'rsatish 🇺🇿 tilini tanlab oling.\n\n\nЗдравствуйте! Чтобы пользоваться нашим ботом вам необходимо пройти регистрацию. \n\nДавайте для начала выберем 🇷🇺 язык обслуживания.", 
    Extra.markup((m) => m.inlineKeyboard([m.callbackButton("O'zbek tili 🇺🇿", "#lang_uz"), m.callbackButton("Русский язык 🇷🇺", "#lang_ru")])))

    //console.log(ctx.message);
})

bot.action(/\#(lang)\_\w+/g, (ctx) => {
  const { match } = ctx;

  if (match.input) {
    let lang = match.input.split('_')[1];
    ctx.i18n.locale(lang);
    ctx.scene.enter('user-info');
  }
})

bot.on('message', async (ctx) => {
  const message_id = ctx.message.message_id;
  const chat_id = ctx.message.chat.id;
  const user_id = ctx.message.from.id;
  const created_at = new Date(ctx.message.date * 1000);
  const bot_id = await about();
  //ctx.reply(ctx.message);
    if (ctx.message.text) {
      //ctx.reply({ message_id, chat_id, user_id, created_at, bot_id})
      const text = ctx.message.text;
    }

    if (ctx.message.photo) {
      const file_id = ctx.message.photo[1].file_id;
      const { file_path } = await bot.telegram.getFile(file_id)
      const download_link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`
      ctx.reply(download_link);
    }

    if (ctx.message.video) {
      const file_id = ctx.message.video.file_id;
      const { file_path } = await bot.telegram.getFile(file_id)
      const download_link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`
      const mime_type = ctx.message.video.mime_type;
      ctx.reply(download_link);
    }

    if (ctx.message.document) {
      const file_id  = ctx.message.document.file_id;
      const { file_path } = await bot.telegram.getFile(file_id)
      const download_link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`
      const mime_type = ctx.message.document.mime_type;
      ctx.reply(download_link);
    }

    if (ctx.message.voice) {
      const file_id = ctx.message.voice.file_id;
      const { file_path } = await bot.telegram.getFile(file_id)
      const download_link = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`
      const mime_type = ctx.message.voice.mime_type;

      ctx.reply(download_link)
    }
})



bot.launch();
