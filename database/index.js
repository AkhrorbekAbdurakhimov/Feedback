const { database } = require('./connection');

class Bot {
    static async registerBot (details) {
        const sql = `
            INSERT INTO bots (
                id,
                first_name,
                username,
                token
            ) VALUES (
                $1, $2, $3, $4
            ) RETURNING *;
        `
        const result = await database.query(sql, details)
        return result.rows || []
    } 
    
    static async getBotsByToken (token) {
        const sql = `
            SELECT 
                *
            FROM bots
            WHERE token = $1;
        `
        const result = await database.query(sql, [token])
        return result.rows || []
    }
    
    static async getTokens () {
        const sql = `
            SELECT 
                token
            FROM bots;
                
        `
        const result = await database.query(sql)
        return result.rows || []
    }
    
    static async insertAdminBots (details) {
        const sql = `
            INSERT INTO adminbots (
                admin_id,
                bot_id
            ) VALUES (
                $1, $2
            );
        `
        const result = await database.query(sql, details)
        return result.rows || []
    }
    
    static async getUser ({ user_id, bot_id}) {
        const sql = `
            SELECT * FROM users WHERE user_id = $1 AND bot_id = $2;
        `
        const result = await database.query(sql, [user_id, bot_id])
        return result.rows || []
    }
    
    static async getUsers (botId) {
        const sql = `
            SELECT * FROM users WHERE bot_id = $1;
        `
        const result = await database.query(sql, [botId])
        return result.rows || [] 
    }
    
    static async insertUser ({user_id, first_name, username, full_name, bot_id, phone_number, profile_photo}) {
        const sql = `
            INSERT INTO users (
                user_id,
                first_name,
                username,
                full_name,
                phone_number,
                profile_photo,
                bot_id
            ) values ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `
        const result = await database.query(sql, [user_id, first_name, username, full_name, phone_number, profile_photo, bot_id]);
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
                message_send_at,
                message_status
            ) values ($1, $2, $3, $4, $5, $6, $7)
        `
        const result = await database.query(sql, messageDetails);
        return result.rows || []
    }
    
    static async getMessages ({ botId, userId }) {
        const sql = `
            SELECT
                *
            FROM
                messages 
            WHERE reciever_id = $1 OR sender_id = $2 AND reciever_id = $2 OR sender_id = $1;`;
        const result = await database.query(sql, [botId, userId]);
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
            returning id;`;
            
        const result = await database.query(sql, adminDetails);
        return result.rows || []
    }
    
    static async adminLogin ({username, password}) {
        const sql = `
            SELECT
                id
            FROM admins
            WHERE username = $1 AND password = md5(md5($2)) 
        `
        const result = await database.query(sql, [username, password]);
        return result.rows || []
    }
    
    static async getAdminBots (adminId) {
        const sql = `
            SELECT
                b.*
            FROM bots b
            RIGHT JOIN adminbots ab on ab.bot_id = b.id
            WHERE ab.admin_id = $1
        `
        const result = await database.query(sql, [adminId]);
        return result.rows || []
    }
}

module.exports = Bot;
