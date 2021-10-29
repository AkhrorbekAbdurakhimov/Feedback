const path = require('path');
const Telegraf = require('telegraf');
const session = require("telegraf/session");
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const TelegrafI18n = require('telegraf-i18n');
const Bot = require('./../database');
const { Markup } = Telegraf

const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
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

const botStart = async (token) => {
    const bot = new Telegraf(token)
    bot.use(session());
    bot.use(i18n.middleware());
    bot.start(ctx => ctx.reply('Tilni tanlang!', inlineMessageRatingKeyboard))
    bot.action('uzbek', (ctx) => {
        ctx.i18n.locale('uz')
        const message = ctx.i18n.t('greeting', {
            first_name: ctx.from.first_name
        })
        ctx.replyWithMarkdown(message);
    })
    bot.action('russian', (ctx) => {
        ctx.i18n.locale('ru')
        const message = ctx.i18n.t('greeting', {
            first_name: ctx.from.first_name
        })
        ctx.replyWithMarkdown(message);
    })
    const feedbackWizard = new WizardScene('feedback-wizard',
        (ctx) => {
            ctx.reply(ctx.i18n.t('output1'));
            ctx.scene.session.user = {}
            return ctx.wizard.next();
        },
        (ctx) => {
            ctx.scene.session.user.full_name = ctx.message.text;
            ctx.reply(ctx.i18n.t('output2'), {
                reply_markup: {
                    keyboard: [[
                        {
                            text: `📲 ${ctx.i18n.t('output3')}`,
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
            ctx.reply(ctx.i18n.t('output4'));
            let currentUserId = await Bot.getUser(ctx.from.id)
            if (!currentUserId.length) {
                const profile_photo = await ctx.telegram.getUserProfilePhotos(ctx.from.id)
                const fileId = profile_photo ? profile_photo.photos[0][2].file_id : ''
                const file_url = await ctx.telegram.getFileLink(fileId)
                await Bot.insertUser([
                    ctx.from.id,
                    ctx.from.first_name,
                    ctx.from.username,
                    ctx.scene.session.user.full_name,
                    ctx.scene.session.user.phone_number,
                    file_url,
                    ctx.chat.id
                ])
            }
            return ctx.wizard.next();
        },
        async (ctx) => {
            let message = ctx.message.text, message_type = 'text';
            if (ctx.message.document) {
                message = await ctx.telegram.getFileLink(ctx.message.document.file_id)
                message_type = ctx.message.document.mime_type
            } 
            if (ctx.message.photo) {
                message = await ctx.telegram.getFileLink(ctx.message.photo[2].file_id)
                message_type = 'photo'
            }
            if (ctx.message.voice) {
                message = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
                message_type = ctx.message.voice.mime_type
            }
            if (ctx.message.video) {
                message = await ctx.telegram.getFileLink(ctx.message.video.file_id)
                message_type = ctx.message.video.mime_type
            }
            await Bot.insertMessage([
                ctx.message.message_id,
                ctx.from.id,
                ctx.chat.id,
                message_type,
                message,
                new Date(1000 * ctx.message.date),
            ])
            ctx.reply(ctx.i18n.t('output5'));
            return ctx.scene.leave();
        }
    );
    
    const stage = new Stage([feedbackWizard]);
    stage.command('feedback', ctx => {
        ctx.scene.enter('feedback-wizard');
    });
    bot.use(stage.middleware())
    
    bot.startPolling()
}

module.exports = { botStart }