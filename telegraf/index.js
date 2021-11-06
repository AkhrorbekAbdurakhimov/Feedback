const fs = require('fs');
const path = require('path');
const Telegraf = require('telegraf');
const session = require("telegraf/session");
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const TelegrafI18n = require('telegraf-i18n');
const Bot = require('../database');
let botRegistered = false
const { Markup } = Telegraf

const inlineMessageLanguageKeyboard = Markup.inlineKeyboard([
    Markup.callbackButton("🇺🇿 O`zbekcha", 'uzbek'),
    Markup.callbackButton('🇷🇺 Русский', 'russian')
]).extra()

const inlineMessageFeedbackKeyboarduz = Markup.inlineKeyboard([
    Markup.callbackButton("Fikr-mulohaza qoldirish", 'feedback'),
]).extra()


const inlineMessageFeedbackKeyboardru = Markup.inlineKeyboard([
    Markup.callbackButton("Оставить комментарий", 'feedback'),
]).extra()

const i18n = new TelegrafI18n({
    directory: path.resolve(__dirname, 'locales'),
    defaultLanguage: 'uz',
    sessionName: 'session',
    useSession: true,
    templateData: {
        pluralize: TelegrafI18n.pluralize,
        uppercase: (value) => value.toUpperCase()
    }
})

const bot = new Telegraf(process.env.token)
bot.use(session());
bot.use(i18n.middleware());
bot.start(ctx => {
    ctx.reply("Botdan to'liq foydalanish uchun tilni tanlang va ro'yxatdan o'ting!\nВыберите язык, чтобы использовать все возможности бота!", inlineMessageLanguageKeyboard)
})
    
bot.action('uzbek', (ctx) => {
    ctx.i18n.locale('uz')
    const message = ctx.i18n.t('greeting', {
        first_name: ctx.from.first_name
    })
    ctx.replyWithMarkdown(message, inlineMessageFeedbackKeyboarduz);
})
    
bot.action('russian', (ctx) => {
    ctx.i18n.locale('ru')
    const message = ctx.i18n.t('greeting', {
        first_name: ctx.from.first_name
    })
    ctx.replyWithMarkdown(message, inlineMessageFeedbackKeyboardru);
})

const feedbackWizard = new WizardScene('feedback-wizard',
    async (ctx) => {
        botRegistered = true
        ctx.scene.session.user = {}
        ctx.scene.session.user.user_id = ctx.update.callback_query.from.id;
        ctx.scene.session.user.bot_id = (await bot.telegram.getMe()).id
        let data = await Bot.getUser(ctx.scene.session.user)
        if (data.length) {
            ctx.reply(ctx.i18n.t('feedback'));
            return ctx.scene.leave();
        }
        ctx.reply(ctx.i18n.t('full_name'));
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.scene.session.user.first_name = ctx.message.from.first_name;
        ctx.scene.session.user.username = ctx.message.from.username;
        ctx.scene.session.user.full_name = ctx.message.text;
        ctx.reply(ctx.i18n.t('phone'), {
            reply_markup: {
                keyboard: [[
                    {
                        text: `📲 ${ctx.i18n.t('send')}`,
                        request_contact: true
                    }
                ]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.scene.session.user.phone_number = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
        const profile_photo = await ctx.telegram.getUserProfilePhotos(ctx.scene.session.user.user_id);
        let file_url = '';
        if (profile_photo.total_count) {
            const fileId = profile_photo.photos[0][2].file_id
            file_url = `/file/${process.env.token}/${fileId}`;
        }
        ctx.scene.session.user.profile_photo = file_url;
        await Bot.insertUser(ctx.scene.session.user);
        ctx.reply(ctx.i18n.t('feedback'));
        return ctx.scene.leave();
    }
);

const stage = new Stage([feedbackWizard]);

stage.action('feedback', ctx => {
    ctx.scene.enter('feedback-wizard');
})

bot.use(stage.middleware())

bot.on('message', async (ctx) => {
    const bot_id = (await bot.telegram.getMe()).id
    let message = ctx.message.text, message_type = 'text';
    if (ctx.message.document) {
        message = `/file/${process.env.token}/${ctx.message.document.file_id}`
        message_type = ctx.message.document.mime_type
    } 
    if (ctx.message.photo) {
        message = `/file/${process.env.token}/${ctx.message.photo[2].file_id}`
        message_type = 'photo'
    }
    if (ctx.message.voice) {
        message = `/file/${process.env.token}/${ctx.message.voice.file_id}`
        message_type = ctx.message.voice.mime_type
    }
    if (ctx.message.video) {
        message = `/file/${process.env.token}/${ctx.message.video.file_id}`
        message_type = ctx.message.video.mime_type
    }
    
    if (botRegistered) {
        await Bot.insertMessage([
            ctx.from.id,
            bot_id,
            message_type,
            message,
            new Date(1000 * ctx.message.date),
        ])
    }
})

process.on('message', async function(msg) {
    try {
        let message, date, from_id
        if (msg.type === 'text') {
            let res = await bot.telegram.sendMessage(msg.recieverId, msg.message)
            if (res) {
                date = new Date(100 * res.date)
                from_id = res.from.id
                message = msg.message
            }
        } 
        if (msg.type.includes('image')) {
            let res = await bot.telegram.sendPhoto(msg.recieverId, {
                source: msg.message
            })
            if (res) {
                let fileId = res.photo[1].file_id
                date = new Date(100 * res.date)
                from_id = res.from.id
                message = `/file/${process.env.token}/${fileId}`
            }
        }
        if (msg.type.includes('audio')) {
            let res = await bot.telegram.sendAudio(msg.recieverId, {
                source: msg.message
            })
            if (res) {
                let fileId = res.voice.file_id
                date = new Date(100 * res.date)
                from_id = res.from.id
                message = `/file/${process.env.token}/${fileId}`
            }
        }
        if (msg.type.includes('application')) {
            let res = await bot.telegram.sendDocument(msg.recieverId, {
                source: msg.message
            })
            if (res) {
                let fileId = res.document.file_id
                date = new Date(100 * res.date)
                from_id = res.from.id
                message = `/file/${process.env.token}/${fileId}`
            }
        }
        if (msg.type.includes('video')) {
            let res = await bot.telegram.sendVideo(msg.recieverId, {
                source: msg.message
            })
            if (res) {
                let fileId = res.video.file_id
                date = new Date(100 * res.date)
                from_id = res.from.id
                message = `/file/${process.env.token}/${fileId}`
            }
        }
        if (msg.type !== 'text' && msg.message) {
            fs.unlinkSync(msg.message)
        }
        
        if (from_id && msg.recieverId && msg.type && message && date) {
            await Bot.insertMessage([
                from_id,
                msg.recieverId,
                msg.type,
                message,
                date,
            ])
        }
    } catch (err) {
        throw err
    }
});

bot.catch((err) => {
    console.log(err);
});

bot.startPolling()

    
    
        

