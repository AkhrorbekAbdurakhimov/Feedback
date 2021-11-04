const { database } = require('./connection');

class Bot {
    static async registerBot (details) {
        const sql = `
            INSERT INTO bots (
                id,
                token
            ) VALUES (
                $1, $2
            ) RETURNING *;
        `
        const result = await database.query(sql, details)
        return result.rows || []
    } 
    
    static async insertAdminBots (details) {
        const sql = `
            INSERT INTO adminbots (
                admin_id,
                bot_id
            ) VALUES (
                $1, $2
            )
        `
        const result = await database.query(sql, details)
        return result.rows || []
    }
    
    static async getUser ({ id, bot_id}) {
        const sql = `
            SELECT id FROM users WHERE id = $1 AND bot_id = $2;
        `
        const result = await database.query(sql, [id, bot_id])
        return result.rows || []
    }
    
    static async insertUser ({id, first_name, username, full_name, bot_id, phone_number, profile_photo}) {
        const sql = `
            INSERT INTO users (
                id,
                first_name,
                username,
                full_name,
                phone_number,
                profile_photo,
                bot_id
            ) values ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `
        const result = await database.query(sql, [id, first_name, username, full_name, phone_number, profile_photo, bot_id]);
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
