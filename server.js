const { config: dotenvConfig } = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

dotenvConfig()

const app = express();
const server = http.createServer(app);

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.on('end', () => {
    console.log(req.method, res.statusCode, req.originalUrl)
  })
  next();
});

process.on('uncaughtException', (error) => console.error(error))

module.exports = { app, server };
