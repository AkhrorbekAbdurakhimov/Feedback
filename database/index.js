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
    
    static async insertUser (user_details) {
        const sql = `
            INSERT INTO users (
                id,
                first_name,
                username,
                profile_picture,
                bot_id
            ) values ($1, $2, $3, $4, $5)
        `
        const result = await database.query(sql, user_details);
        return result.rows || []
    }
}

module.exports = Bot;
