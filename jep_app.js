var express = require('express');
var app = express();
var cron = require('node-cron');
var port = process.env.PORT || 5000;

const configurarCron = '* */1 * * *';
const configurarCronClientes = '* */2 * * *';

cron.schedule(configurarCron, () => {
    require('./app2.js');
});
cron.schedule(configurarCronClientes, () => {
    require('./otro.js');
});