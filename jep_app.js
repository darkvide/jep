var express = require('express');
var app = express();
var cron = require('node-cron');
var port = process.env.PORT || 5000;

const configurarCron = '* */1 * * *';
const configurarCronProductos = '* */2 * * *';
const configurarCronClientes = '* */2 * * *';
const conftest = '* 1 * * * *';

// cron.schedule(configurarCron, () => {
//     require('./app2.js');
// });
// cron.schedule(configurarCronProductos, () => {
//     require('./app.js');
// });
// cron.schedule(configurarCronClientes, () => {
//     require('./otro.js');
// });
cron.schedule(conftest, () => {
    let now = new Date();
    console.log('dark', now);
});