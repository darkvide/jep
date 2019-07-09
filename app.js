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

const configurarCron = '*/5 * * * *';

var connection;

function handleDisconnect() {
    connection = mysql.createConnection(config_mysql_prod);
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
    const datosStock = [];

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
    const productosSqlServer = result[1]['sqlServerDataClients'];
    // ahora unir la info de sql server con mysql
    const clientesArray = productosSqlServer.map(clientes => {
        return {
            ...clientes,
            mysql: clientesMysql.find(cm => {
                return cm.email == clientes.email;
            })
        };
    });
    return (clientesArray, clientesArray);
});

// aqui a actualizar todos los productos

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
                    //console.log(producto.stock, producto.precios.prec01, producto.mysql.id_product);
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


/*dataClientesPromise.then(clientes => {
    //update stock
    clientes.forEach(cliente => {
        const hoy = '2019-05-21 14:54:31';
        if (cliente.mysql != null || cliente.mysql != undefined) {
            /*connection.query(`UPDATE twofowg1_jepnode.ps_stock_available, twofowg1_jepnode.ps_product , twofowg1_jepnode.ps_product_shop
            SET twofowg1_jepnode.ps_product.quantity = ${producto.stock},twofowg1_jepnode.ps_stock_available.quantity = ${producto.stock},twofowg1_jepnode.ps_product.price = ${producto.precios.prec01},twofowg1_jepnode.ps_product_shop.price = ${producto.precios.prec01}
            WHERE 
            twofowg1_jepnode.ps_product.id_product=twofowg1_jepnode.ps_product_shop.id_product
            AND twofowg1_jepnode.ps_product.id_product=twofowg1_jepnode.ps_stock_available.id_product
            AND twofowg1_jepnode.ps_stock_available.id_product = ${producto.mysql.id_product};`, (error_stock2, result_stock2) => {
                if (!error_stock2) {
                    console.log(producto.stock, producto.precios.prec01, producto.mysql.id_product);
                    //console.log('actualizado stock ' + producto.mysql.id_product);
                } else {
                    console.log(error_stock2);
                }
            });
        } else {
            connection.query(`INSERT INTO twofowg1_jepnode.ps_customer (twofowg1_jepnode.ps_customer.id_shop_group,twofowg1_jepnode.ps_customer.id_shop,twofowg1_jepnode.ps_customer.id_gender,twofowg1_jepnode.ps_customer.id_default_group,twofowg1_jepnode.ps_customer.id_lang,twofowg1_jepnode.ps_customer.id_risk,twofowg1_jepnode.ps_customer.firstname,twofowg1_jepnode.ps_customer.lastname,twofowg1_jepnode.ps_customer.email,twofowg1_jepnode.ps_customer.passwd,twofowg1_jepnode.ps_customer.date_add,twofowg1_jepnode.ps_customer.date_upd) VALUES (1,1,0,${cliente.tipind},1,0,'${cliente.nomcli}','${cliente.nomcli}','${cliente.email}',"$2y$10$FOnZ7jFGGelEUD7GjjEJNey6Vj9CZ0sm4QnOA1lNellHXvFjS4Z.6","` + hoy + `","` + hoy + `");
            `, (error_customer, result_customer) => {
                if (!error_customer) {
                    connection.query(`INSERT INTO twofowg1_jepnode.ps_customer_group (twofowg1_jepnode.ps_customer_group.id_customer,twofowg1_jepnode.ps_customer_group.id_group) VALUES (${result_customer.insertId},${cliente.tipind})
                        `, (error_customer_group, result_customer_group) => {
                        if (!error_customer_group) {
                            console.log('insertado grupo');
                        } else {
                            console.log(error_customer_group);
                        }
                    });
                    connection.query(`
                        INSERT INTO twofowg1_jepnode.ps_address (twofowg1_jepnode.ps_address.id_country,twofowg1_jepnode.ps_address.id_state,twofowg1_jepnode.ps_address.id_customer,twofowg1_jepnode.ps_address.alias,twofowg1_jepnode.ps_address.company,twofowg1_jepnode.ps_address.lastname,twofowg1_jepnode.ps_address.firstname,twofowg1_jepnode.ps_address.address1,twofowg1_jepnode.ps_address.address2,twofowg1_jepnode.ps_address.city,twofowg1_jepnode.ps_address.phone,twofowg1_jepnode.ps_address.dni,twofowg1_jepnode.ps_address.date_add,twofowg1_jepnode.ps_address.date_upd) VALUES (81,20,'${result_customer.insertId}','Delivery address','${cliente.nomcli}','estrella','david','${cliente.dircli}+${cliente.dirnum}','${cliente.dirint}','${cliente.ciucli}',${cliente.telcel},${cliente.rucced},'` + hoy + `','` + hoy + `')
                        `, (error_adress, result_adress) => {
                        if (!error_adress) {
                            console.log('insertado direccion');
                        } else {
                            console.log(error_adress);
                        }
                    });
                } else {
                    console.log(error_customer);
                }
            });

        }
    });*
    //update precios
});*/