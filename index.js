const path = require('path');
const cluster = require('cluster');
const workers = {}
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const cors = require('cors');

const app = express();
const { APP } = require('./config');
const { errorMessageHandler } = require('./utils/helper');
const botRouter = require('./routes/bot');
const authRouter = require('./routes/auth');
const messageRouter = require('./routes/message');
const fileRouter = require('./routes/file');
const Bot = require('./database');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'public', 'files'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
  
const upload = multer({ storage: storage })

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '5MB' }));
app.use(express.static(path.join(__dirname, 'public')));
    
if (cluster.isMaster) {
    console.log('Master ' + process.pid + ' has started.');
    ;(async () => {
        let data = await Bot.getTokens()
        data.forEach(el => {
            let env = {
                token: el.token
            }
            let worker = cluster.fork(env)
            workers[el.token] = worker
        })
    })()
    app.use('/bot', botRouter, (req, res) => {
        let env = {
            token: req.body.token
        }
        let worker = cluster.fork(env)
        workers[req.body.token] = worker
    });
    app.use('/message', upload.single('message'), (req, res, next) => {
        if (req.body.token) {
            workers[req.body.token].send({
                from: 'This is from master ' + process.pid + ' to worker ' + workers[req.body.token].process.pid,
                recieverId: req.body.recieverId,
                message: req.file ? req.file.path : req.body.message,
                type: req.file ? req.file.mimetype : 'text'
            });
        }
        
        next()
    }, messageRouter)
    app.use('/auth', authRouter);
    app.use('/file', fileRouter);
    
    app.use((req, res) => {
        res.status(404).send({
            message: 'Not found',
        });
    });
    app.use((err, req, res, next) => {
        const error = errorMessageHandler(err.status, err.message);
        res.status(err.status || 500).send(error);
    });
    
    app.listen(APP.PORT, '0.0.0.0', () => {
        console.log(`server started on port: ${APP.PORT}`);
    });
    
} else {
    console.log('Worker ' + process.pid + ' has started.');
    require('./telegraf');
}