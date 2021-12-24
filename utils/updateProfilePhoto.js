const Telegraf = require('telegraf');
const { database } = require('../database/connection');

const getUsers = async () => {
    const sql = `SELECT user_id, SPLIT_PART(profile_photo, '/', 4) as profile_photo, bot_id FROM users;`;
    const result = await database.query(sql);
    return result.rows;
}

const updateProfilePhoto = async (id, file_id) => {
    const sql = `UPDATE users SET profile_photo = $2 WHERE user_id = $1`;
    const result = await database.query(sql, [id, file_id]);
    return result.rows;
}

const getToken = async (bot_id) => {
    const sql = `SELECT token FROM bots WHERE id = $1;`;
    const result = await database.query(sql, [bot_id]);
    return result.rows[0];
}

const updateUserProfilePhoto = async () => {
    try {
        const users = await getUsers();

        for (let i = 0; i < users.length; i++) {
            let token = await getToken(users[i].bot_id);
            const bot = new Telegraf(token)
            let profile_photo = await bot.telegram.getUserProfilePhotos(users[i].user_id);
            console.log(profile_photo)
            if (profile_photo.total_count > 0 && profile_photo.photos[0][2].file_id != users[i].profile_photo) {
                await updateProfilePhoto(users[i].user_id, `/file/${token}/${profile_photo.photos[0][2].file_id}`);
            }
        }

        setTimeout(async () => { updateUserProfilePhoto() }, 86400)

    } catch (error) {
        console.log(error)
    }
}

module.exports = updateUserProfilePhoto;