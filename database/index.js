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
    
    static async getUser (id) {
        const sql = `
            SELECT id FROM users WHERE id = $1;
        `
        const result = await database.query(sql, [id])
        return result.rows || []
    }
    
    static async insertUser (user_details) {
        const sql = `
            INSERT INTO users (
                id,
                first_name,
                username,
                full_name,
                phone_number,
                profile_picture,
                bot_id
            ) values ($1, $2, $3, $4, $5, $6, $7)
        `
        const result = await database.query(sql, user_details);
        return result.rows || []
    }
    static async insertMessage (message_details) {
        const sql = `
            INSERT INTO messages (
                message_id,
                sender_id,
                reciever_id,
                message_type,
                message,
                message_send_at
            ) values ($1, $2, $3, $4, $5, $6)
        `
        const result = await database.query(sql, message_details);
        return result.rows || []
    }
}

module.exports = Bot;
