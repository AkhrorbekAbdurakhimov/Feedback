const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = require('express').Router();
const { catchReject } = require('../../utils/helper');
const { adminRegisterSchema, adminLoginSchema } = require('./schema');
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
        fs.writeFileSync(path.join(process.cwd(), 'public', 'pictures', avatarUuid), value.profilePhoto, 'base64');
    }
    
    let adminDetails = [
        value.username,
        value.password,
        value.fullName,
        value.phoneNumber,
        `/pictures/${avatarUuid}`
    ]
    
    try {
        let admin = await Bot.registerAdmin(adminDetails)
        res.send({
            status: 200,
            data: admin
        })
    } catch (err) {
        return next({
            status: 409,
            message: 'This kind of username has already exists',
          });
    }
})

const loginAdmin = catchReject(async (req, res, next) => {
    const { error, value } = adminLoginSchema.validate(req.body)
    if (error)
        return next({
            status: 400,
            message: error.details[0].message,
        })
        
    let admin = await Bot.adminLogin(value)
    if (!admin.length) {
        return next({
            status: 401
        })
    }
    
    res.send({
        status: 200,
        data: admin
    })
})

const getAdminBots = catchReject(async (req, res, next) => {
    let adminId = req.params.adminId
    let bots = await Bot.getAdminBots(adminId)
    res.send({
        status: 200,
        data: bots
    })
})

router.use('/register', registerAdmin)
router.use('/login', loginAdmin)
router.use('/get-admin-bots/:adminId', getAdminBots)

module.exports = router;
