const db = require('../database/connection');

class User {}
    static async registerUser(user) {
        const sql = `
            INSERT INTO users 
            VALUES ( $1 )
            RETURNING *;`;
        
        const result = await db.query(sql);
        return result.rows || [];
    }
}


module.exports = User;