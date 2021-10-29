const path = require('path');
const Telegraf = require('telegraf');
const session = require("telegraf/session");
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const TelegrafI18n = require('telegraf-i18n');

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
    bot.start(ctx => {
        const message = ctx.i18n.t('greeting', {
            first_name: ctx.from.first_name
        })
        ctx.replyWithMarkdown(message);
    })
    bot.command('uz', (ctx) => {
        ctx.i18n.locale('uz')
        const message = ctx.i18n.t('greeting', {
            first_name: ctx.from.first_name
        })
        ctx.replyWithMarkdown(message);
    })
    bot.command('ru', (ctx) => {
        ctx.i18n.locale('ru')
        const message = ctx.i18n.t('greeting', {
            first_name: ctx.from.first_name
        })
        ctx.replyWithMarkdown(message);
    })
    bot.command('help', (ctx) => {
        ctx.reply(ctx.i18n.t('help'));
    })
    const feedbackWizard = new WizardScene('feedback-wizard',
        (ctx) => {
            ctx.reply(ctx.i18n.t('output1'));
            ctx.scene.session.user = {}
            ctx.scene.session.user.senderId = ctx.from.id
            ctx.scene.session.user.recieverId = ctx.from.id
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
        (ctx) => {
            ctx.scene.session.user.phone_number = ctx.message.contact ? ctx.message.contact.phone_number : ctx.message.text;
            ctx.reply(ctx.i18n.t('output4'));
            return ctx.wizard.next();
        },
        (ctx) => {
            ctx.scene.session.user.message_id = ctx.message.message_id;
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