var express = require('express');
var app = express();
var cron = require('node-cron');
var sql = require('mssql');
var mysql = require('mysql');
var port = process.env.PORT || 5000;

const config_sql = {
    user: 'darkvid',
    password: '1234',
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
    host: "162.241.224.119",
    user: "twofowg1_darkvid",
    password: "De12345678",
    database: "twofowg1_jepnode"
};
var config_mysql = {
    host: "localhost",
    user: "root",
    password: "",
    database: "prestatienda"
};

const configurarCron = '*/1 * * * *';

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(config_mysql_prod); // Recreate the connection, since
    // the old one cannot be reused.

    connection.connect(function(err) { // The server is either down
        if (err) { // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 20000); // We introduce a delay before attempting to reconnect,
            // cada 20 segundos se conecta y se desconec osea eso hace siempre y cuando encuentre un error de desconexion
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

console.group('corriendo');

const sqlServerProducts = new Promise((resolve, reject) => {
    new sql.ConnectionPool(config_sql).connect().then(pool => {
        //return pool.request().query(`select codart,prec01,prec02,prec03,prec04 from articulos where codemp=16`)
        return pool.request().query(`SELECT codart,codalt,desart,nomart,nomcla,nomfam,marca,coduni,poriva,prec01,prec02,prec03,prec04,codpro,nompro,codfab,ultcos,cospro,exiact FROM kdbs_jep.dbo.web_articulos`)
    }).then(result => {
        sql.close();
        return resolve(result.recordset);
    }).catch(err => {
        res.status(500).send({ message: "${err}" })
        sql.close();
    });
});


// capturar datos de sql server
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



const promisesSql = [sqlServerProducts, sqlServeClients];

const idsProductosPromise = Promise.all(promisesSql).then(results => {
    const sqlServerDataProducts = results[0];
    const sqlServerDataClients = results[1];
    const totalRecordsProducts = sqlServerDataProducts.length;
    const totalRecordsClients = sqlServerDataClients.length;
    const datosStock = [];
    const datosClientes = [];

    for (let h = 0; h < totalRecordsProducts; h++) {

        datosStock.push({
            'idProductoStock': String(sqlServerDataProducts[h].codalt).trim(),
            'stock': sqlServerDataProducts[h].exiact,
            'precios': sqlServerDataProducts.find(precio => String(precio.codalt).trim() === String(sqlServerDataProducts[h].codalt).trim())

        });

    }

    return { datosStock, sqlServerDataClients };
});

const mysqlProductPromise = new Promise((resolve, reject) => {
    return connection.query(`
        SELECT twofowg1_jepnode.ps_product.id_product,twofowg1_jepnode.ps_product.supplier_reference 
        FROM twofowg1_jepnode.ps_product 
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
        from twofowg1_jepnode.ps_customer pc
        `, (error_clientes, result_clientes) => {
        if (!error_clientes) {
            return resolve(JSON.parse(JSON.stringify(result_clientes)));
        }
        return resolve([]);
    });
});

const dataProductosPromise = Promise.all([mysqlProductPromise, idsProductosPromise]).then(result => {
    const productosMysql = result[0];
    const productosSqlServer = result[1]['datosStock'];
    // ahora unir la info de sql server con mysql
    const productos = productosSqlServer.map(producto => {
        return {
            ...producto,
            mysql: productosMysql.find(pm => {
                return pm.supplier_reference.replace(/ /ig, '') == producto.idProductoStock.replace(/ /ig, '');
            })
        };
    });
    return (productos, productos.filter(p => p.mysql));
});
const dataClientesPromise = Promise.all([mysqlClientPromise, idsProductosPromise]).then(result => {
    const clientesMysql = result[0];
    console.log(clientesMysql);
    return;
    const productosSqlServer = result[1]['datosStock'];
    // ahora unir la info de sql server con mysql
    const productos = productosSqlServer.map(producto => {
        return {
            ...producto,
            mysql: productosMysql.find(pm => {
                return pm.supplier_reference.replace(/ /ig, '') == producto.idProductoStock.replace(/ /ig, '');
            })
        };
    });
    return (productos, productos.filter(p => p.mysql));
});

// aqui a actualizar todos los productos
/*
cron.schedule(configurarCron, () => {
    dataProductosPromise.then(productos => {
        //update stock
        productos.forEach(producto => {
            connection.query(`UPDATE twofowg1_jepnode.ps_stock_available, twofowg1_jepnode.ps_product , twofowg1_jepnode.ps_product_shop
            SET twofowg1_jepnode.ps_product.quantity = ${producto.stock},twofowg1_jepnode.ps_stock_available.quantity = ${producto.stock},twofowg1_jepnode.ps_product.price = ${producto.precios.prec01},twofowg1_jepnode.ps_product_shop.price = ${producto.precios.prec01}
            WHERE 
            twofowg1_jepnode.ps_product.id_product=twofowg1_jepnode.ps_product_shop.id_product
            AND twofowg1_jepnode.ps_product.id_product=twofowg1_jepnode.ps_stock_available.id_product
            AND twofowg1_jepnode.ps_stock_available.id_product = ${producto.mysql.id_product};`, (error_stock2, result_stock2) => {
                if (!error_stock2) {
                    console.log(producto.stock,producto.precios.prec01,producto.mysql.id_product);
                    //console.log('actualizado stock ' + producto.mysql.id_product);
                } else {
                    console.log(error_stock2);
                }
            });
            connection.query(`
            REPLACE INTO twofowg1_jepnode.ps_specific_price
            (twofowg1_jepnode.ps_specific_price.id_product,twofowg1_jepnode.ps_specific_price.id_shop,twofowg1_jepnode.ps_specific_price.id_currency,twofowg1_jepnode.ps_specific_price.id_country,twofowg1_jepnode.ps_specific_price.id_group,twofowg1_jepnode.ps_specific_price.price,twofowg1_jepnode.ps_specific_price.reduction_type) 
            VALUES
            (${producto.mysql.id_product},1,1,81,3,${producto.precios.prec01},"amount"),
            (${producto.mysql.id_product},1,1,81,4,${producto.precios.prec02},"amount"),
            (${producto.mysql.id_product},1,1,81,5,${producto.precios.prec03},"amount"),
            (${producto.mysql.id_product},1,1,81,6,${producto.precios.prec04},"amount")
            `, (error_stock2, result_stock2) => {
                if (!error_stock2) {
                    console.log('actualizado precio1 ' + producto.mysql.id_product);
                } else {
                    console.log(error_stock2);
                }
            });

        });
        //update precios
    });
});

// aqui a actualizar todos los clientes
*/