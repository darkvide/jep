var express = require('express');
var app = express();
var cron = require('node-cron');
var sql = require('mssql');
var mysql = require('mysql');
var port = process.env.PORT || 5000;

var config_sql = {
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
    user: "twofowg1_WPYQG",
    password: "247Ec!!!!",
    database: "twofowg1_jep"
};
var config_mysql = {
    host: "localhost",
    user: "root",
    password: "",
    database: "prestatienda"
};

const configurarCron='*/2 * * * *';

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(config_mysql_prod); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 20000); // We introduce a delay before attempting to reconnect,
      // cada 20 segundos se conecta y se desconec osea eso hace siempre y cuando encuentre un error de desconexion
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

console.group('corriendo');



// capturar detos de sql server
const sqlServerPromise = new Promise((resolve, reject) => {
    new sql.ConnectionPool(config_sql).connect().then(pool => {
        return pool.request().query(`
        select k.codart as codigo, ROUND(SUM(k.cantot * (44 - ASCII(t.sigdoc))), 2) AS existencia 
        from kardex k, kardex_tipo_doc t 
        where k.tipdoc = t.tipdoc and k.codemp=16 GROUP BY k.codemp, k.codalm, k.codart order by 1;`)// esto trae productos trae los id y el stock
    }).then(result => {
        sql.close();
        return resolve(result.recordset);
    }).catch(err => {
        sql.close();
        return reject(err)
    });
});

const sqlServerProducts = new Promise((resolve, reject) => {
    new sql.ConnectionPool(config_sql).connect().then(pool => {
            return pool.request().query(`select codart,prec01,prec02,prec03,prec04 from articulos where codemp=16`)
        }).then(result => {
            sql.close();
            return resolve(result.recordset);
        }).catch(err => {
            res.status(500).send({ message: "${err}" })
            sql.close();
        });
});

const promisesSql = [sqlServerPromise, sqlServerProducts];

const idsProductosPromise = Promise.all(promisesSql).then(results => {
    const sqlServerData = results[0];
    const sqlServerDataProducts = results[1];
    const totalRecords = sqlServerData.length;
    const totalRecordsProducts = sqlServerDataProducts.length;
    const idStock = [];
    const descProd = [];
    const codart = [];
    const stockArray = [];
    const datosStock = [];
    const preciosArray = [];

    for (let h = 0; h < totalRecords; h++) {
            
        datosStock.push({
            'idProductoStock' : String(sqlServerData[h].codigo).trim(),
            'stock' : sqlServerData[h].existencia,
            'precios': sqlServerDataProducts.find(precio => String(precio.codart).trim() === String(sqlServerData[h].codigo).trim())
        
        });
        idStock.push("'"+String(sqlServerData[h].codigo).trim()+"'");
        
    }
    /** Esta es la estructura de los datos para sql server te sirve? simon 
     * 5470 en total
     * [ { idProductoStock: '0306051501',
      stock: 10,
      precios:
       { codart: '0306051501          ',
         prec01: 108.36,
         prec02: 122.45,
         prec03: 102.94,
         prec04: 137.62 } }...
    ]
    */
    return datosStock;
});

const mysqlProductPromise = new Promise((resolve, reject) => {
    var stockArray = [];
     return connection.query(`
        SELECT twofowg1_jepweb.ps_product.id_product,twofowg1_jepweb.ps_product.supplier_reference 
        FROM twofowg1_jepweb.ps_product 
        ` , (error_stock, result_stock) => {
        if (!error_stock) {
            return resolve(JSON.parse(JSON.stringify(result_stock)));
        }
        return resolve([]);
    });
});

const dataProductosPromise = Promise.all([mysqlProductPromise, idsProductosPromise]).then(result =>{
    const productosMysql = result[0]; 
    const productosSqlServer = result[1];
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
cron.schedule(configurarCron, () => {
    dataProductosPromise.then(productos => {
        //update stock
        productos.forEach(producto => { 
            connection.query(`UPDATE twofowg1_jepweb.ps_stock_available, twofowg1_jepweb.ps_product , twofowg1_jepweb.ps_product_shop
            SET twofowg1_jepweb.ps_stock_available.quantity = ${producto.stock},twofowg1_jepweb.ps_product.price = ${producto.precios.prec01},twofowg1_jepweb.ps_product_shop.price = ${producto.precios.prec01}
            WHERE 
            twofowg1_jepweb.ps_product.id_product=twofowg1_jepweb.ps_product_shop.id_product
            AND twofowg1_jepweb.ps_product.id_product=twofowg1_jepweb.ps_stock_available.id_product
            AND twofowg1_jepweb.ps_stock_available.id_product = ${producto.mysql.id_product};`, (error_stock2, result_stock2) => {
                if (!error_stock2) {
                    console.log('actualizado stock '+producto.mysql.id_product);
                } else {
                    console.log(error_stock2);
                }
            });
            connection.query(`
            REPLACE INTO twofowg1_jepweb.ps_specific_price
            (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) 
            VALUES
            (${producto.mysql.id_product},1,1,81,3,${producto.precios.prec01},"amount"),
            (${producto.mysql.id_product},1,1,81,4,${producto.precios.prec02},"amount"),
            (${producto.mysql.id_product},1,1,81,5,${producto.precios.prec03},"amount"),
            (${producto.mysql.id_product},1,1,81,6,${producto.precios.prec04},"amount")
            `, (error_stock2, result_stock2) => {
                if (!error_stock2) {
                    console.log('actualizado los precios '+producto.mysql.id_product);
                } else {
                    console.log(error_stock2);
                }
            });
            
        });
        //update precios
    });
});

var server = app.listen(port, function () {
    console.log('Conected...');
});