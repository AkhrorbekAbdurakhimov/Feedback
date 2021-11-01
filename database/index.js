const { database } = require('./connection');

class Bot {
    static async registerBot (botDetails) {
        const sql = `
            INSERT INTO bots (
                bot_token
            ) VALUES (
                $1
            ) RETURNING *;
        `
        const result = await database.query(sql, botDetails)
        return result.rows || []
    } 
    
    static async insertAdminBots (botDetails) {
        const sql = `
            INSERT INTO adminbots (
                admin_id,
                bot_id
            ) VALUES (
                $1, $2
            )
        `
        const result = await database.query(sql, botDetails)
        return result.rows || []
    }
    
    static async getBotTokens () {
        const sql = `
            SELECT id, bot_token FROM bots;
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
    
    static async insertUser (userDetails) {
        const sql = `
            INSERT INTO users (
                id,
                full_name,
                phone_number,
                created_at,
                bot_id
            ) values ($1, $2, $3, $4, $5)
            RETURNING *;
        `
        const result = await database.query(sql, userDetails);
        return result.rows || []
    }
    
    static async insertMessage (messageDetails) {
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
        const result = await database.query(sql, messageDetails);
        return result.rows || []
    }
    
    static async getMessages (botId) {
        const sql = `
            SELECT
                *
            FROM
                messages 
            where reciever_id = $1
        `
        const result = await database.query(sql, [botId]);
        return result.rows || []
    }
    
    static async registerAdmin (adminDetails) {
        const sql = `
            INSERT INTO admins (
                username,
                password,
                full_name,
                phone_number,
                profile_picture
            ) values ($1, md5(md5($2)), $3, $4, $5)
            returning id
        `
        const result = await database.query(sql, adminDetails);
        return result.rows || []
    }
}

module.exports = Bot;
