const cluster = require('cluster');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const { APP } = require('./config');
const { errorMessageHandler } = require('./utils/helper');
const botRouter = require('./routes/bot');

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '5MB' }));
    
if (cluster.isMaster) {
    
    app.use('/bot', (req, res, next) => {
        let env = {
            token: req.body.token
        }
        cluster.fork(env)
        next()
    }, botRouter);
    
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
    console.log("bot started at token: ", process.env.token);
    require('./telegraf');
}