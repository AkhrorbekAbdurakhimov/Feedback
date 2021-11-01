const Telegraf = require('telegraf');
const fs = require('fs');
const path = require('path');

class bot {
    // static async setChatPhoto (id, token, photo) {
    //     console.log(photo);
    //     try {
    //         let bot = new Telegraf(token)
    //         let data = (await bot.telegram.setChatPhoto(id, path.join(process.cwd(), 'pictures', photo))).response()
    //         console.log(data);
    //     } catch (err) {
    //         console.log(err);
    //     }
    // }
    static async setChatDescription (id, token, description) {
        try {
            let bot = new Telegraf(token)
            let data = (await bot.telegram.setChatDescription(id, description))
            console.log(data);
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = bot