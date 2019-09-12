var express = require('express');
var app = express();
var sql = require('mssql');
var mysql = require('mysql');
const config_sql = {
    user: 'darkvid',
    password: '12345',
    server: '127.0.0.1',
    database: 'Kdbs_jep',
    driver: 'tedious',
    options: {
        encrypt: false
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
    pool: {
        idleTimeoutMillis: 300000,
        max: 100
    }
};

var config_mysql_prod = {
    host: "162.241.224.119",
    user: "twofowg1_WPYQG",
    password: "247Ec!!!!",
    database: "twofowg1_jepweb"
};



var connection;

function handleDisconnect() {
    connection = mysql.createConnection(config_mysql_prod);
    con2 = mysql.createConnection(config_mysql_prod);
    con3 = mysql.createConnection(config_mysql_prod);
    con4 = mysql.createConnection(config_mysql_prod);
    connection.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 20000); // We introduce a delay before attempting to reconnect,
        } // to avoid a hot loop, and to allow our node script to
    }); // process asynchronous requests in the meantime.
    // If you're also serving http, display a 503 error.
    connection.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect(); // lost due to either server restart, or a
        } else { // connnection idle timeout (the wait_timeout
            throw err; // server variable configures this)
        }
    });
}

handleDisconnect();

const sqlServerProducts = new Promise((resolve, reject) => {
    new sql.ConnectionPool(config_sql).connect().then(pool => {
        return pool.request().query(`SELECT codart,codalt,desart,nomart,nomcla,nomfam,marca,coduni,poriva,prec01,prec02,prec03,prec04,codpro,nompro,codfab,ultcos,cospro,exiact,estado
        ,modbas
        ,codmod
        ,numbul FROM kdbs_jep.dbo.web_articulos where estado!=3 and marca is not null and modbas is  not null and codmod is not null `)
    }).then(result => {
        sql.close();
        return resolve(result.recordset);
    }).catch(err => {
        //res.status(500).send({ message: "${err}" })
        sql.close();
    });
});

const mysqlProductsPromise = new Promise((resolve, reject) => {
    return connection.query(`
        TRUNCATE TABLE v_articulos_jep; 
        `, (error_product, result_product) => {
        if (!error_product) {
            return resolve(JSON.parse(JSON.stringify(result_product)));
        } else {
            console.log('ERROR"::::', error_product);
            return reject([]);
        }
    });
});

idsProductosPromise = Promise.all([sqlServerProducts, mysqlProductsPromise]).then(results => {
    let productos = results[0];
    let vistasql = results[1];
    productos.forEach(producto => {
        connection.query(`INSERT INTO  v_articulos_jep (codart,codalt,desart,nomart,nomcla,nomfam,marca,coduni,poriva,prec01,prec02,prec03,prec04,codpro,nompro,codfab,ultcos,cospro,exiact,estado,modbas,codmod,numbul)
        values ('${producto.codart}','${producto.codalt}','${producto.desart}','${producto.nomart}','${producto.nomcla}','${producto.nomfam}','${producto.marca}','${producto.coduni}','${producto.poriva}',${producto.prec01},${producto.prec02},${producto.prec03},${producto.prec04},'${producto.codpro}','${producto.nompro}','${producto.codfab}','${producto.ultcos}','${producto.cospro}','${producto.exiact}','${producto.estado}','${producto.modbas}','${producto.codmod}','${producto.numbul}');`, (error_stock2, result_stock2) => {
            if (!error_stock2) {
                console.log('producto insertado');
                //console.log(producto.stock, producto.precios.prec01, producto.mysql.id_product);
                /*console.log(`UPDATE ps_stock_available, ps_product , ps_product_shop
                SET ps_product.quantity = ${producto.exiact},ps_stock_available.quantity = ${producto.exiact},ps_product.price = ${producto.prec01},ps_product_shop.price = ${producto.prec01}
                WHERE 
                ps_product.id_product=ps_product_shop.id_product
                AND ps_product.id_product=ps_stock_available.id_product
                AND ps_stock_available.id_product = ${producto.mysql.id_product};`);*/
            } else {
                console.log(error_stock2);
            }
        });
    });
});