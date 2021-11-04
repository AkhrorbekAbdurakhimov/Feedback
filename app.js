const { Telegraf } = require("telegraf");
const TelegrafI18n = require("telegraf-i18n");
const path = require("path");
const { Pool } = require("pg");
const numeral = require("numeral");

const Stage = require("telegraf/stage");
const WizardScene = require("telegraf/scenes/wizard");

const { Extra, Markup } = Telegraf;
const { match } = TelegrafI18n;

const config = require("./config");
const cache = require("./cache");
const handler = require("./handlers");

const Dyhxx = require("./api");
const helpers = require("./helpers");
const { renderMenuKeyboard, isCarNumber } = require("./helpers");
const { captureRejectionSymbol } = require("events");
const api = new Dyhxx();

// eslint-disable-next-line new-cap
cache.html = Extra.HTML();
cache.markdown = Extra.markdown();
cache.noSound = Extra
  // eslint-disable-next-line new-cap
  .HTML()
  .notifications(false);

const lang_opts = Extra.markup((m) => m.inlineKeyboard([m.callbackButton("Русский язык 🇷🇺", "#lang_ru"), m.callbackButton("O'zbek tili 🇺🇿", "#lang_uz")]));

let i18n = new TelegrafI18n({
  directory: path.resolve("locales"),
  defaultLanguage: "uz",
  sessionName: "session",
  useSession: true,
});

const bot = new Telegraf(config.bot_token);

const userWizard = new WizardScene(
  "ADD_CAR_WIZARD",
  (ctx) => {
    ctx.reply(ctx.i18n.t("add_car"), cache.markdown);
    ctx.wizard.state = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message.text == "/start") {
      handler.getCarList(ctx);
      return ctx.scene.leave();
    }
    let string = ctx.message.text.toUpperCase().trim();
    if (helpers.number_texPassport.test(string)) {
      string = string.split(" ");
      let carNumber = string[0];
      let texPassport = string[1];
      if (!isCarNumber(carNumber)) {
        ctx.reply(ctx.i18n.t("wrong_car_format"));
        return;
      }
      const id = ctx.message.from.id;
      ctx.wizard.state.carNumber = carNumber;
      ctx.wizard.state.texPassport = texPassport;

      let { data } = await api.isCarExist(id, carNumber, texPassport);
      if (data.status === 200) {
        if (!data.isCarExists) return ctx.reply(ctx.i18n.t("notFound"));
        if (data.hasCarDB) return ctx.reply(ctx.i18n.t("exists_db"));
      }

      const shouldSave = Extra.markup((m) => m.inlineKeyboard([m.callbackButton(ctx.i18n.t("yes"), "true"), m.callbackButton(ctx.i18n.t("no"), "false")]));
      ctx.reply(ctx.i18n.t("shouldSave"), shouldSave);
      return ctx.wizard.next();
    } else if (!handler.Scenes(ctx, "ADD_CAR_WIZARD", true)) {
      ctx.reply(ctx.i18n.t("wrong_car_format"));
    }
  },
  async (ctx) => {
    if (ctx.message) {
      let flag = handler.Scenes(ctx, "ADD_CAR_WIZARD", true);
      if (flag) {
        return false;
      } else {
        return ctx.reply(ctx.i18n.t("please_choose_from"));
      }
    }

    const { callback_query } = ctx.update;

    if (callback_query.data === "true") {
      const { id } = ctx.from;
      const { carNumber, texPassport } = ctx.wizard.state;
      api.saveCar(id, carNumber, texPassport).then(({ data }) => {
        if (data.status === 200) ctx.answerCbQuery(ctx.i18n.t("added"));
        else if (data.status === 401) ctx.i18n.t("notFound");
        else ctx.answerCbQuery(ctx.i18n.t("error"));
      });
    } else if (callback_query.data === "false") {
      ctx.answerCbQuery(ctx.i18n.t("not_added"));
    }
    ctx.deleteMessage();
    handler.getCarList(ctx);
    return ctx.scene.leave();
  }
);

const userRemoveWizard = new WizardScene(
  "REMOVE_CAR_WIZARD",
  async (ctx) => {
    let { id } = ctx.from;
    const { data } = await api.getCarList(id);
    if (data.status === 200) {
      let keyboard = helpers.renderCarsKeyboard(data.data, ctx.i18n);
      ctx.reply(ctx.i18n.t("remove_car"), keyboard);
    } else if (data.status === 404) {
      ctx.reply(ctx.i18n.t("empty_list"));
      handler.getCarList(ctx);
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message.text == "/start") {
      handler.getCarList(ctx);
      return ctx.scene.leave();
    }
    let carNumber = ctx.message.text;
    if (!isCarNumber(carNumber)) {
      if (!handler.Scenes(ctx, "REMOVE_CAR_WIZARD")) {
        ctx.reply(ctx.i18n.t("wrong_car_format"));
      }
      handler.getCarList(ctx);
      ctx.scene.leave();
      return;
    }

    carNumber = carNumber.replace("🚘 ", "");
    ctx.wizard.state.carNumber = carNumber;

    const shouldSave = Extra.markup((m) => m.inlineKeyboard([m.callbackButton(ctx.i18n.t("yes"), "true"), m.callbackButton(ctx.i18n.t("no"), "false")]));
    ctx.reply(ctx.i18n.t("shouldRemove"), shouldSave);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message) {
      let flag = handler.Scenes(ctx, "REMOVE_CAR_WIZARD");
      if (flag) {
        return false;
      } else return ctx.reply(ctx.i18n.t("please_choose_from"));
    }

    const { callback_query } = ctx.update;
    if (callback_query.data === "true") {
      const { id } = ctx.from;
      const { carNumber } = ctx.wizard.state;
      api.removeCar(id, carNumber).then(({ data }) => {
        if (data.status === 200) {
          ctx.answerCbQuery(ctx.i18n.t("removed"));
          ctx.deleteMessage();
        } else ctx.answerCbQuery(ctx.i18n.t("error"));
      });
    } else if (callback_query.data === "false") {
      ctx.deleteMessage();
      ctx.answerCbQuery(ctx.i18n.t("not_removed"));
    }

    let menu = helpers.renderMenuKeyboard(ctx.i18n);
    ctx.reply(ctx.i18n.t("please_choose_from"), menu);
    handler.getCarList(ctx);
    return ctx.scene.leave();
  }
);

const stage = new Stage([userWizard, userRemoveWizard]);

bot.use(Telegraf.session());
bot.use(i18n.middleware());

// Checks on unrderconstruction
bot.use((ctx, next) => {
  if (config.isUnderConstruction) {
    ctx.reply("🇺🇿 Ayrim sabablarga ko'ra bot faoliyati to'xtatildi.\n\n🇷🇺 По некоторым причинам, бот перестал функционировать.");
    return false;
  } else next();
});

// Sets language
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const { data } = await api.getLanguage(ctx.from.id);
    if (data.language_code && data.language_code !== ctx.i18n.locale()) {
      ctx.i18n.locale(data.language_code);
    }
  }
  next();
});

bot.use(stage.middleware());

// Logs user activities
bot.use(async (ctx, next) => {
  let id, text;
  if (ctx.message) {
    id = ctx.message.from.id;
    text = ctx.message.text;
  } else {
    if (ctx.update.callback_query) {
      id = ctx.update.callback_query.from.id;
      text = ctx.update.callback_query.data;
    }
  }
  let actionType = helpers.getActionType(text);
  if (id && text && actionType !== -1) {
    api.logUserAction(id, text, actionType);
  }
  next();
});

bot.command("start", async (ctx) => {
  await api.registerUser(ctx.from).then(({ data }) => {
    if (data.status === 200 && data.language_code) {
      ctx.i18n.locale(data.language_code);
      ctx.reply(ctx.i18n.t("greetings"), { ...cache.markdown });
      handler.getCarList(ctx);
    } else if (data.status === 200) {
      return ctx.reply("Илтимос тилни танланг", lang_opts);
    } else return ctx.reply("Илтимос тилни танланг", lang_opts);
  });
});

// If not registered, registers
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const { data } = await api.checkUserExist(ctx.from.id);
    if (data.status === 200) {
      if (data.exists) next();
      else {
        ctx.reply(ctx.i18n.t("start_again"));
      }
    }
  }
});

bot.command("post", async (ctx) => {
  const { message, from } = ctx;
  let msg = message.text.replace("/post", "").trim();
  if (msg.length > 0) {
    if (config.ADMIN_ID == from.id) {
      const { data } = await api.getUsers();
      for (let i = 0; i < data.users.length; i++) {
        await ctx.telegram
          .sendMessage(data.users[i].id, msg)
          .then(({ chat }) => api.setBroadcastStatus(chat.id, "ok"))
          .catch((err) => {
            err_msg = `${err.response.error_code}: ${err.response.description}`;
            api.setBroadcastStatus(err.on.payload.chat_id, err_msg);
          });
      }
    }
  }
});

bot.action(/\#(lang)\_\w+/g, (ctx) => {
  const { match } = ctx;
  if (match.input) {
    let lang = match.input.split("_")[1];
    handler.changeLanguage(ctx, lang);
    handler.getCarList(ctx);
  }
});

bot.action(/^\#(saveaspdf)\_\d+\_\w+$/, (ctx) => {
  if (ctx.match.input) {
    let violation_id = ctx.match.input.split("_")[1];
    let filename = ctx.match.input.split("_")[2] + ".pdf";
    handler.sendPDF(ctx, violation_id, filename);
  }
});

bot.action(/^\#(savecarnumber)\_(yes|no)$/, (ctx) => {
  let flag = ctx.match[0].split("_")[1];
  if (flag === "yes") {
    const { carNumber, texPassport } = ctx.session;
    api.saveCar(ctx.from.id, carNumber, texPassport).then(({ data }) => {
      if (data.status === 403) {
        ctx.deleteMessage();
        ctx.answerCbQuery("Limit reached");
        return ctx.reply(ctx.i18n.t("limit_reached"));
      }
      ctx.answerCbQuery("Saved");
      ctx.deleteMessage();
      handler.getCarList(ctx);
    });
  } else {
    ctx.answerCbQuery("Not saved");
    ctx.deleteMessage();
  }
});

bot.action(/^\#(pay)\_\w+\_\d+$/, (ctx) => {
  const message_id = ctx.update.callback_query.message.message_id;
  let string = ctx.match[0].split("_");
  let protocol = string[1];
  let amount = string[2];

  ctx.answerCbQuery(ctx.i18n.t("select_payment_type"));
  ctx.replyWithChatAction("typing");
  api
    .getDiscountPriceFromUpay(protocol)
    .then(({ data }) => {
      let amount = data.namedParams.filter((item) => item.title === "Amount");
      if (amount.length > 0) {
        amount = parseInt(amount[0].value);
        api.getPaymeUrl(protocol, amount).then(({ data }) => {
          let PaySystems = {
            UPay: helpers.getUPayLink(protocol),
            Click: helpers.getClickLink(protocol, amount),
          };

          if (!data.error) PaySystems.PayMe = helpers.getPaymeLink(data.result.cheque._id);

          ctx.reply(
            `${ctx.i18n.t("select_payment_type")}\n\n${ctx.i18n.t("violation.sum")} ${numeral(amount).format("0,0")}`,
            Extra.inReplyTo(message_id).markup((m) => {
              let arr = [];
              Object.keys(PaySystems).map((value) => {
                arr.push(m.urlButton(value, PaySystems[value]));
              });
              return m.inlineKeyboard(arr);
            })
          );
        });
      } else {
        return ctx.reply(ctx.i18n.t("error"));
      }
    })
    .catch((err) => {
      console.log(err.response.data);
    });
});

bot.action(/^\#(saveas)\_(video|location)\_\d+$/, (ctx) => {
  let loading_message_id;
  const message_id = ctx.update.callback_query.message.message_id;
  let replyto = Extra.inReplyTo(message_id);

  let { 1: type, 2: id } = ctx.match[0].split("_");
  if (id) {
    api.getViolationsParams(id).then(({ data }) => {
      if (data.status === 200) {
        if (type === "video") {
          ctx.replyWithChatAction("upload_video");
          ctx.answerCbQuery(ctx.i18n.t("video_downloading"));
          api.sendVideoToClound(id, data.video).then(({ data }) => {
            if (data.status === 200) {
              let interval = setInterval(() => {
                ctx.replyWithChatAction("upload_video");
                api.getVideoID(id).then(({ data }) => {
                  if (data.status === 200) {
                    if (data.tgid != null) {
                      ctx
                        .replyWithDocument(data.tgid, {
                          thumb: {
                            source: "../images/logo.png",
                            filename: "logo.png",
                          },
                          reply_to_message_id: message_id,
                          caption: "@dyhxxuz_bot",
                        })
                        .catch((err) => {
                          console.log(err.message);
                          return ctx.reply(ctx.i18n.t("error"));
                        });
                      clearInterval(interval);
                    }
                  } else return ctx.reply(ctx.i18n.t("error"));
                });
              }, 2000);
            } else return ctx.reply(ctx.i18n.t("error"));
          });
        } else {
          ctx.answerCbQuery(ctx.i18n.t("location_sending"));
          ctx.replyWithChatAction("find_location");
          return ctx.replyWithLocation(data.location.latitude, data.location.longitude, replyto);
        }
      } else {
        return ctx.reply(ctx.i18n.t("error"));
      }
    });
  } else {
    ctx.answerCbQuery("No video");
  }
});

bot.command("savollar", async (ctx) => {
  const { message, from } = ctx;
  let msg = message.text.replace("/savollar", "").trim();
  if (config.ADMIN_ID == from.id) {
    const { data } = await api.getUsers();
    let text = `🇺🇿🇺🇿 \nQoida buzarliklar haqida avtomatik ma'lumot olish bo'yicha, sizga qaysi biri qulay?\n\n🇷🇺🇷🇺\nКакой из методов получения информации о нарушениях ПДД вам удобен?`;
    for (let i = 0; i < data.users.length; i++) {
      await ctx.telegram
        .sendMessage(data.users[i].id, text, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Telegram orqali | Через телеграмм",
                  callback_data: `telegram_${data.users[i].id}`,
                },
              ],
              [
                {
                  text: "SMS orqali | через СМС",
                  callback_data: `sms_${data.users[i].id}`,
                },
              ],
              [
                {
                  text: "Mobile App orqali | через Мобильное приложение",
                  callback_data: `app_${data.users[i].id}`,
                },
              ],
            ],
          },
        })
        .then(({ chat }) => api.setBroadcastStatus(chat.id, "ok"))
        .catch((err) => {
          err_msg = `${err.response.error_code}: ${err.response.description}`;
          api.setBroadcastStatus(err.on.payload.chat_id, err_msg);
        });
    }
  }
});

bot.action([/^(app)\_\d+$/, /^(telegram)\_\d+$/, /^(sms)\_\d+$/], async (ctx) => {
  try {
    let string = ctx.match[0].split("_");
    let answer = string[0];
    let user_id = string[1];
    let DB = {
      host: "192.168.100.242",
      user: "postgres",
      password: "postgres",
      port: 5432,
      database: "dyhxx",
      application_name: "dyhxx_bot",
    };
    const pool = new Pool(DB);

    await pool.query(`UPDATE users SET is_online_form = $1 WHERE id = $2`, [answer, user_id]);
    pool.end;
    ctx.answerCbQuery("Javobingiz uchun rahmat.");
    ctx.deleteMessage();
  } catch (error) {
    console.log(error);
  }
});

bot.hears(helpers.number_texPassport, async (ctx) => {
  let string = ctx.match[0].toUpperCase().trim().split(" ");

  let carNumber = string[0].trim();
  let texPassport = string[string.length - 1].trim();

  if (/^🚘\s(\w|\d){6,9}$/.test(carNumber) || helpers.isCarNumber(carNumber)) carNumber = carNumber.replace("🚘 ", "");
  else return ctx.reply(ctx.i18n.t("wrong_car_format"));

  ctx.session.carNumber = carNumber;
  ctx.session.texPassport = texPassport;
  handler.getViolations(ctx, carNumber, texPassport);
});

bot.hears(helpers.Formats, async (ctx) => {
  let carNumber = ctx.match[0].toUpperCase();

  carNumber = carNumber.replace("🚘 ", "");

  ctx.session.carNumber = carNumber;

  handler.getViolations(ctx, carNumber, "true");
});

bot.hears(match("keyboard.menu"), (ctx) => {
  const { i18n, reply } = ctx;
  const menu = renderMenuKeyboard(i18n);
  reply(ctx.i18n.t("please_choose_from"), menu);
});

bot.hears([match("keyboard.update"), match("keyboard.back")], (ctx) => {
  handler.getCarList(ctx);
});

bot.hears([match("keyboard.add_car")], (ctx) => {
  api.checkLimit(ctx.from.id).then(({ data }) => {
    if (data.status === 200 && !data.limit) {
      ctx.scene.enter("ADD_CAR_WIZARD");
    } else return ctx.reply(ctx.i18n.t("limit_reached"));
  });
});

bot.hears([match("keyboard.remove_car")], (ctx) => {
  ctx.scene.enter("REMOVE_CAR_WIZARD");
});

bot.hears([match("keyboard.change_language")], (ctx) => {
  return ctx.reply("Илтимос тилни танланг", lang_opts);
});

bot.on("document", (ctx) => {
  if (ctx.message.from.id === config.CLOUD_ID) {
    let request_id = ctx.message.caption.replace("#id_", "");
    api.callback(request_id, ctx.message.document.file_id);
  }
});

splice = (idx, rem, str, source) => {
  return source.slice(0, idx) + str + source.slice(idx + Math.abs(rem));
};

bot.on("message", async (ctx) => {
  if (ctx.from.id === config.CLOUD_ID && (ctx.message.video || ctx.message.photo)) {
    if (!ctx.message.caption) return;
    if (ctx.message.caption && ctx.message.caption.match(/\#id\_\d+/g)) return;

    await api.resetAds();
    const { data } = await api.getUsers();
    let chat_id,
      c = [0, 0];

    let { message_id } = await ctx.reply("Ok", {
      reply_to_message_id: ctx.message.message_id,
    });

    let cb = () => {
      ctx.telegram.editMessageText(ctx.chat.id, message_id, null, `✅ Success: ${c[0]}\n⁉️ Error: ${c[1]}\n\n[${(((c[0] + c[1]) * 100) / data.users.length).toFixed(1)}%]`);
    };

    let interval = setInterval(cb, 5000);

    for (let i = 0; i < data.users.length; i++) {
      chat_id = data.users[i].id;
      await ctx
        .copyMessage(chat_id, {
          reply_markup: ctx.message.reply_markup,
        })
        .then(async (e) => {
          c[0]++;
          await api.setAdsStatus(chat_id, "ok");
        })
        .catch(async (err) => {
          c[1]++;
          err_msg = `${err.response.error_code}: ${err.response.description}`;
          await api.setAdsStatus(chat_id, err_msg);
        });
    }
    clearInterval(interval);
    return;
  }

  ctx.reply(ctx.i18n.t("not_supported_action"));
});

bot.catch((err) => {
  console.log(err);
});

bot.startPolling();
