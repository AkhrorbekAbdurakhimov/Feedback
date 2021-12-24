const fs = require('fs');
const path = require('path');
const Telegraf = require('telegraf');
const session = require("telegraf/session");
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const TelegrafI18n = require('telegraf-i18n');
const Bot = require('../database');
let botRegistered = false;
let language;
const { Markup } = Telegraf

const inlineMessageLanguageKeyboard = Markup.inlineKeyboard([
    Markup.callbackButton("🇺🇿 O`zbekcha", 'uzbek'),
    Markup.callbackButton('🇷🇺 Русский', 'russian')
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

console.log(process.env.token)
const bot = new Telegraf(process.env.token)
bot.use(session());
bot.use(i18n.middleware());

bot.start(ctx => {
    console.log('hi');
    ctx.reply(ctx.i18n.t('greeting'), inlineMessageLanguageKeyboard)
})

function validateName(name) {
    const regex = /^[a-zA-Z ]{5,30}$/;
    return regex.test(name);
}

function validatePhone(phone) {
    const regex = /998[0-9]{9}$/;
    return regex.test(phone);
}

const feedbackWizard = new WizardScene('feedback-wizard',
    async (ctx) => {
        botRegistered = true
        ctx.scene.session.user = {}
        ctx.scene.session.user.user_id = ctx.update.callback_query.from.id;
        ctx.scene.session.user.bot_id = (await bot.telegram.getMe()).id
        ctx.scene.session.user.language = language;
        let data = await Bot.getUser(ctx.scene.session.user)
        if (data.length) {
            ctx.reply(ctx.i18n.t('feedback'));
            return ctx.scene.leave();
        }
        ctx.reply(ctx.i18n.t('full_name'));
        return ctx.wizard.next();
    },
    async (ctx) => {
        const isValid = validateName(ctx.message.text);
        if (!isValid) return ctx.reply(ctx.i18n.t('name_validation'))
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
        if(ctx.message.text) {
            const isValid = validatePhone(ctx.message.text);
            if (!isValid) return ctx.reply(ctx.i18n.t('phone_validation'));
        }
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

bot.use(stage.middleware())

bot.action('uzbek', (ctx) => {
    ctx.i18n.locale('uz')
    language = "🇺🇿 O'zbekcha";
    ctx.scene.enter('feedback-wizard');
    ctx.answerCbQuery();
})
    
bot.action('russian', (ctx) => {
    ctx.i18n.locale('ru')
    language = '🇷🇺 Русский'
    ctx.scene.enter('feedback-wizard');
    ctx.answerCbQuery()
})

bot.use(async (ctx, next) => {
    const bot_id = (await bot.telegram.getMe()).id
    if (ctx.update.edited_message && botRegistered) {
        await Bot.insertMessage([
            ctx.update.edited_message.message_id,
            ctx.update.edited_message.from.id,
            bot_id,
            'text',
            ctx.update.edited_message.text,
            new Date(1000 * ctx.update.edited_message.edit_date),
            'edited'
        ])
    }
    next()
})
bot.use(stage.middleware())

bot.on('message', async (ctx) => {
    const bot_id = (await bot.telegram.getMe()).id
    let message = ctx.message.text, message_type = 'text';
    console.log(ctx.message.chat)
    let status = 'original'
    if (ctx.message.document) {
        message = `/file/${process.env.token}/${ctx.message.document.file_id}`
        message_type = ctx.message.document.mime_type
    } 
    if (ctx.message.photo) {
        message = `/file/${process.env.token}/${ctx.message.photo[2].file_id}`
        message_type = 'photo'
    }
    if (ctx.message.audio) {
        message = `/file/${process.env.token}/${ctx.message.voice.file_id}`
        message_type = ctx.message.voice.mime_type
    }
    if (ctx.message.video) {
        message = `/file/${process.env.token}/${ctx.message.video.file_id}`
        message_type = ctx.message.video.mime_type
    }
    
    if (botRegistered) {
        await Bot.insertMessage([
            ctx.message.message_id,
            ctx.from.id,
            bot_id,
            message_type,
            message,
            new Date(1000 * ctx.message.date),
            status
        ])
    }
})

process.on('message', async function(msg) {
    try {
        console.log(msg.messageId);
        if (msg.messageId) {
            if (msg.message) {
                let res = await bot.telegram.editMessageText(msg.chatId, msg.messageId, msg.messageId, msg.message);
                if (res) {
                    await Bot.editMessage(msg.messageId, msg.message);
                }
            } else {
                let res = await bot.telegram.deleteMessage(msg.chatId, msg.messageId);
                if (res) {
                    await Bot.deleteMessage(msg.messageId)
                }
            }
            
        } else {
            console.log(msg);
            if (msg.type === 'text') {
                let res = await bot.telegram.sendMessage(msg.recieverId, msg.message)
                if (res) {
                    message_id = res.message_id
                    date = new Date(1000 * res.date)
                    from_id = res.from.id
                    message = msg.message
                }
            } 
            if (msg.type.includes('image')) {
                let res = await bot.telegram.sendPhoto(msg.recieverId, {
                    source: msg.message
                })
                if (res) {
                    message_id = res.message_id
                    let fileId = res.photo[1].file_id
                    date = new Date(1000 * res.date)
                    from_id = res.from.id
                    message = `/file/${process.env.token}/${fileId}`
                }
            }
            if (msg.type.includes('audio')) {
                let res = await bot.telegram.sendAudio(msg.recieverId, {
                    source: msg.message
                })
                if (res) {
                    message_id = res.message_id
                    let fileId = res.audio.file_id
                    date = new Date(1000 * res.date)
                    from_id = res.from.id
                    message = `/file/${process.env.token}/${fileId}`
                }
            }
            if (msg.type.includes('application')) {
                let res = await bot.telegram.sendDocument(msg.recieverId, {
                    source: msg.message
                })
                if (res) {
                    message_id = res.message_id
                    let fileId = res.document.file_id
                    date = new Date(1000 * res.date)
                    from_id = res.from.id
                    message = `/file/${process.env.token}/${fileId}`
                }
            }
            if (msg.type.includes('video')) {
                let res = await bot.telegram.sendVideo(msg.recieverId, {
                    source: msg.message
                })
                if (res) {
                    message_id = res.message_id
                    let fileId = res.video.file_id
                    date = new Date(1000 * res.date)
                    from_id = res.from.id
                    message = `/file/${process.env.token}/${fileId}`
                }
            }
            if (msg.type !== 'text' && msg.message) {
                fs.unlinkSync(msg.message)
            }

            if (from_id && msg.recieverId && msg.type && message && date) {
                await Bot.insertMessage([
                    message_id,
                    from_id,
                    msg.recieverId,
                    msg.type,
                    message,
                    date,
                    'original'
                ])
            }
            
        }
        
    } catch (err) {
        throw err
    }
});

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.startPolling();
