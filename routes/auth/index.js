const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = require('express').Router();
const { catchReject } = require('../../utils/helper');
const { adminRegisterSchema } = require('./schema');
const Bot = require('../../database');

const registerAdmin = catchReject(async (req, res, next) => {
    const { error, value } = adminRegisterSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
        
    let avatarUuid = null;
    if (value.profilePhoto) {
        avatarUuid = `${uuidv4()}.jpg`;
        value.profilePhoto = value.profilePhoto.replace(/^data:image\/jpeg;base64,/, '').replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(path.join(process.cwd(), 'profiles', avatarUuid), value.profilePhoto, 'base64');
    }
    
    let adminDetails = [
        value.username,
        value.password,
        value.fullName,
        value.phoneNumber,
        avatarUuid
    ]
    
    let admin = await Bot.registerAdmin(adminDetails)
    
    res.send({
        status: 200,
        data: admin
    })
})

router.use('/register', registerAdmin)

module.exports = router;