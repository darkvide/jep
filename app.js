var express = require('express');
var app = express();
var PromiseFtp = require('promise-ftp');
var ftp = new PromiseFtp();
ftp.connect({ host: '247.com.ec', user: 'destrella@247.com.ec', password: 'De1234567890' })
    .then(function(serverMessage) {
        console.log('Server message: ' + serverMessage);
        return ftp.put('csv/productos-jep.csv', 'darktest/productos-jep.csv');
    }).then(function() {
        return ftp.end();
    });