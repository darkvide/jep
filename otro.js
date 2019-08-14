var express = require('express');
var app = express();
var cron = require('node-cron');
var sql = require('mssql');
var mysql = require('mysql');
var port = process.env.PORT || 5000;

const config_sql = {
    user: 'darkvid',
    password: '12345',
    server: '127.0.0.1', // You can use 'localhost\\instance' to connect to named instance
    database: 'Kdbs_jep',
    driver: 'tedious',
    options: {
        encrypt: false // Use this if you're on Windows Azure
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
    pool: {
        idleTimeoutMillis: 300000,
        max: 100
    }
};

var config_mysql_prod = {
    host: "173.231.246.129",
    user: "jepimp5_jpreues",
    password: "xEf;XB2LIMWf",
    database: "jepimp5_cmmpje"
};


const configurarCron = '*/2 * * * *';

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(config_mysql_prod);
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
        ,numbul FROM kdbs_jep.dbo.web_articulos where estado!=3`)
    }).then(result => {
        sql.close();
        return resolve(result.recordset);
    }).catch(err => {
        res.status(500).send({ message: "${err}" })
        sql.close();
    });
});

const sqlServeClients = new Promise((resolve, reject) => {
    new sql.ConnectionPool(config_sql).connect().then(pool => {
        return pool.request().query(`SELECT  codcli,tipind,rucced,nomcli,repcli,contac,ciucli,dircli,dirnum,dirint,telcli,telcas,telcel,email FROM kdbs_jep.dbo.web_clientes`)
    }).then(result => {
        sql.close();
        return resolve(result.recordset);
    }).catch(err => {
        sql.close();
        return reject(err)
    });
});

const mysqlProductPromise = new Promise((resolve, reject) => {
    return connection.query(`
        SELECT ps_product.id_product,ps_product.reference 
        FROM ps_product 
        `, (error_stock, result_stock) => {
        if (!error_stock) {
            return resolve(JSON.parse(JSON.stringify(result_stock)));
        }
        return resolve([]);
    });
});

const mysqlClientPromise = new Promise((resolve, reject) => {
    return connection.query(`
        SELECT pc.email 
        from ps_customer pc
        `, (error_clientes, result_clientes) => {
        if (!error_clientes) {
            return resolve(JSON.parse(JSON.stringify(result_clientes)));
        }
        return resolve([]);
    });
});

function actualizarProductos() {
    const dataProductosPromise = Promise.all([sqlServerProducts, sqlServeClients, mysqlProductPromise, mysqlClientPromise]).then(result => {
        const dataProductosSql = result[0];
        const dataClientesSql = result[1];
        const dataProductosMysql = result[2];
        const dataClientesMysql = result[3];
        const productos = dataProductosSql.map(producto => {
            return {
                ...producto,
                mysql: dataProductosMysql.find(pm => {
                    return pm.reference.replace(/ /ig, '') == producto.codart.replace(/ /ig, '');
                    //return pm.supplier_reference == producto.idProductoStock;
                })
            };
        });
        /**/
        productos.forEach(producto => {
            if (producto.mysql != null || producto.mysql != undefined) {
                connection.query(`UPDATE ps_stock_available, ps_product, ps_product_shop
                SET ps_product.quantity = ${producto.exiact},ps_product.unity  = ${producto.numbul},ps_stock_available.quantity = ${producto.exiact},ps_product.price = ${producto.prec01},ps_product_shop.price = ${producto.prec01}
                WHERE 
                ps_product.id_product=ps_product_shop.id_product
                AND ps_product.id_product=ps_stock_available.id_product
                AND ps_stock_available.id_product = ${producto.mysql.id_product};`, (error_stock2, result_stock2) => {
                    if (!error_stock2) {
                        console.log(producto.mysql.id_product);
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
                connection.query(`
                REPLACE INTO ps_specific_price
                (ps_specific_price.id_product,ps_specific_price.id_shop,ps_specific_price.id_currency,ps_specific_price.id_country,ps_specific_price.id_group,ps_specific_price.price,ps_specific_price.reduction_type) 
                VALUES
                (${producto.mysql.id_product},1,1,81,3,${producto.prec01},"amount"),
                (${producto.mysql.id_product},1,1,81,4,${producto.prec02},"amount"),
                (${producto.mysql.id_product},1,1,81,5,${producto.prec03},"amount"),
                (${producto.mysql.id_product},1,1,81,6,${producto.prec04},"amount")
                `, (error_stock2, result_stock2) => {
                    if (!error_stock2) {
                        console.log('actualizado precio1 ' + producto.mysql.id_product);
                    } else {
                        console.log(error_stock2);
                    }
                });
            }

        });
        //update precios
        /**/
        /*const clientesArray = dataClientesSql.map(clientes => {
            return {
                ...clientes,
                mysql: dataClientesMysql.find(cm => {
                    return cm.email == clientes.email;
                })
            };
        });*/

        //update stock
        //connection.end();
        return { dataProductosSql };

    });
    return dataProductosPromise;
}
const data_1 = actualizarProductos().then();
console.log(data_1);

/*cron.schedule(configurarCron, () => {
    console.log('strak');
});*/