const cluster = require('cluster');
const workers = {}
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const { APP } = require('./config');
const { errorMessageHandler } = require('./utils/helper');
const botRouter = require('./routes/bot');
const authRouter = require('./routes/auth');
const messageRouter = require('./routes/message');

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '5MB' }));
    
if (cluster.isMaster) {
    console.log('Master ' + process.pid + ' has started.');
    app.use('/bot', (req, res, next) => {
        let env = {
            token: req.body.token
        }
        let worker = cluster.fork(env)
        workers[req.body.token] = worker
        next()
    }, botRouter);
    app.use('/message', (req, res, next) => {
        workers[req.body.token].send({
            from: 'This is from master ' + process.pid + ' to worker ' + workers[req.body.token].process.pid,
            recieverId: req.body.reciever_id,
            message: req.body.message
        });
        next()
    }, messageRouter)
    app.use('/auth', authRouter);
    
    app.use((req, res) => {
        res.status(404).send({
            message: 'Not found',
        });
    });
    app.use((err, req, res, next) => {
        console.log(err);
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