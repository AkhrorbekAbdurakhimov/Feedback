const { database } = require('./connection');

class Bot {
    static async registerBot (bot_details) {
        const sql = `
            INSERT INTO bots (
                bot_token
            ) values (
                $1
            ) RETURNING *;
        `
        const result = await database.query(sql, bot_details)
        return result.rows || []
    } 
    
    static async getBotTokens () {
        const sql = `
            SELECT bot_token FROM bots;
        `
        const result = await database.query(sql)
        return result.rows || []
    }
}

module.exports = Bot;
