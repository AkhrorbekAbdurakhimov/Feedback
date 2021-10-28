const { database } = require('./connection');

class User {
    static async register(user_details) {
        const sql = `
            INSERT INTO users (
                account_id,
                first_name,
                username
            ) values (
                $1, $2, $3
            ) RETURNING *;
        `
        const result = await database.query(sql, user_details)
        return result.rows || []
    } 
    static async getUser(account_id) {
        const sql = `
            SELECT
                *
            from
                users
            WHERE account_id = $1
        `
        const result = await database.query(sql, account_id)
        return result.rows || []
    }
    static async insertMessage (message_details) {
        const sql = `
            INSERT INTO messages (
                account_id,
                message,
                date,
                type
            ) values (
                $1, $2, $3, $4
            ) RETURNING *;
        `
        const result = await database.query(sql, message_details)
        return result.rows || []
    }
    static async getMessages () {
        const sql = `
            SELECT
                u.first_name,
                m.type,
                m.message,
                m.date
                FROM messages m
            JOIN users u on u.account_id = m.account_id
        `
        const result = await database.query(sql )
        return result.rows || []
    }
}

module.exports = User;
