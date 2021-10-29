const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const modules = require('./routes')
const { APP } = require('./config')
const { errorMessageHandler } = require('./utils/helper')
const { runBots } = require('./bot/index')

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10MB' }));
app.use(modules);

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

runBots();