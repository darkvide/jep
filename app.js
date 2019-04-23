var express = require('express');
var app = express();
var cron = require('node-cron');
const Agenda = require('agenda');
var sql = require('mssql');
var mysql = require('mysql');
var port = process.env.PORT || 5000;
const agenda = new Agenda();

agenda.define('consolita', {priority: 'high'}, (job, done) => {
    console.log('aqui 1');
    done();
});
(async function() { // IIFE to give access to async/await
    await agenda.start();
  
    await agenda.every('1 minutes', 'consolita');
  
  })();
const configurarCron='* */10 * * * *';
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

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(config_mysql_prod); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 20000); // We introduce a delay before attempting to reconnect,
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
app.get('/', (req, res) => {
//cron.schedule(configurarCron, () => {
    // sqlServer
    
        const sqlServerPromise = new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_sql).connect().then(pool => {
                return pool.request().query('select k.codart as codigo, ROUND(SUM(k.cantot * (44 - ASCII(t.sigdoc))), 2) AS existencia from kardex k, kardex_tipo_doc t where k.tipdoc = t.tipdoc and k.codemp=16 GROUP BY k.codemp, k.codalm, k.codart order by 1;')
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
                return pool.request().query('select codart,prec01,prec02,prec03,prec04 from articulos where codemp=16')
                //return pool.request().query('select codart,prec01,prec02,prec03,prec04 from articulos where codemp=16 and codart in (\'303020401\',\'303020402\',\'303029401\',\'303029402\',\'303029501\',\'303029502\',\'303029901\',\'303029902\',\'303039601\',\'303039602\',\'303040001\',\'303040002\',\'303069601\',\'303069602\',\'303069701\',\'303069702\',\'714110200\',\'714130500\',\'714160700\',\'716029801\',\'716029802\',\'718070800\',\'718080801\',\'718080802\',\'719039201\',\'719039202\',\'719089201\',\'719089202\',\'719089500\',\'719100500\',\'719109900\',\'720110500\',\'1211020500-FT\',\'1214089200\',\'1219059200\',\'1303070001\',\'1303070002\',\'1303070003\',\'1303070004\',\'1303070005\',\'1303070006\',\'1403019300\',\'1403020300\',\'1403020400\',\'1403029900\',\'1403039500\',\'1403049800\',\'1403050000\',\'1403069600\',\'1403080000\',\'1403080300\',\'1403090100\',\'1403090500\',\'1403091200\',\'1403129500\',\'1403130200\',\'1403140600\',\'1403140800\',\'1403151100\',\'1403151700\',\'1403169800\',\'1403171300\',\'1403180400\',\'1403180500\',\'1403181000\',\'1403190700\',\'1403191000\',\'1403211000\',\'1404019500\',\'1404029800\',\'1404039900\',\'1406049200\',\'1406050400\',\'1406050900\',\'1406051500\',\'1406059700\',\'1406069200\',\'1406079800\',\'1406081200\',\'1406081600\',\'1406109600\',\'1406110200\',\'1406120700\',\'1406121200\',\'1406131200\',\'1406131500\',\'1406149200\',\'1406150800\',\'1406151300\',\'1406160500\',\'1406160800\',\'1406161300\',\'1408019400\',\'1408029800\',\'1408040700\',\'4011010100\',\'4011061000\',\'4013090300\',\'4013090301\',\'4013090302\',\'4013120600\',\'4014079200\',\'4014110200\',\'4014130500\',\'4019039100\',\'4019039200\',\'4019100000\',\'4020089600\',\'4020110300\',\'4088019200\',\'4209101400\',\'3303019300\',\'3303029900\',\'3303039601\',\'3303069600\',\'3303070001\',\'3303080300\',\'3303080400\',\'3303090100\',\'3303090200\',\'3303090500\',\'3303091200\',\'3303091300\',\'3303108300\',\'3303129500\',\'3303130200\',\'330315100\',\'3303180400\',\'3303180500\',\'3303190400\')')
            }).then(result => {
                sql.close();
                return resolve(result.recordset);
            }).catch(err => {
                res.status(500).send({ message: "${err}" })
                sql.close();
            });
    });

    const sqlServerClients = new Promise((resolve, reject) => {
        new sql.ConnectionPool(config_sql).connect().then(pool => {
            return pool.request().query('select codcli,nomcli,rucced,dircli,telcli,contac,estatus,ciucli,repcli,email from clientes where codemp=16')
        }).then(result => {
            sql.close();
            return resolve(result.recordset);
        }).catch(err => {
            res.status(500).send({ messagesss: "${err}" })
            sql.close();
        });
    });
    

        const idProductosPromise = Promise.all([sqlServerPromise, sqlServerProducts, sqlServerClients]).then(results => {
            const sqlServerData = results[0];
            const sqlServerDataProducts = results[1];
            const sqlServerDataClients = results[2];
            const totalRecords = sqlServerData.length;
            const totalRecordsProducts = sqlServerDataProducts.length;
            const totalRecordsClients = sqlServerDataClients.length;
            const idStock = [];
            const descProd = [];
            const codart = [];
            const stockArray = [];
            const datosStock = [];
            const preciosArray = [];
            for (let j = 0; j < totalRecordsProducts; j++) {
                descProd.push({
                    'id_productosdark' : String(sqlServerDataProducts[j].codart).trim(),
                    'price_01' : sqlServerDataProducts[j].prec01,
                    'price_02' : sqlServerDataProducts[j].prec02,
                    'price_03' : sqlServerDataProducts[j].prec03,
                    'price_04' : sqlServerDataProducts[j].prec04
                });
                codart.push("'"+String(sqlServerDataProducts[j].codart).trim()+"'");
            }
            
            const pr = new Promise((resolve, reject) => {
                console.log('iniciandose espere por favor');
                return connection.query('SELECT twofowg1_jepweb.ps_product.id_product,twofowg1_jepweb.ps_product.supplier_reference FROM twofowg1_jepweb.ps_product where twofowg1_jepweb.ps_product.supplier_reference in ('+codart+');' , (error_prod, result_prod) => {
                    if (!error_prod) {
                        for (var i in result_prod) {
                            for(var j = 0; j<descProd.length; j++){
                                if(result_prod[i].supplier_reference == descProd[j].id_productosdark){
                                    preciosArray.push({
                                        'id_producto' : "'"+String(result_prod[i].id_product).trim()+"'",
                                        'precio_01' : descProd[j].price_01,
                                        'precio_02' : descProd[j].price_02,
                                        'precio_03' : descProd[j].price_03,
                                        'precio_04' : descProd[j].price_04
                                    });
                                }
                            }
                        }
                    }else{
                        console.log(error_prod);
                    }
                    return resolve(preciosArray);
                });
            });
            pr.then(preciosArray => {
                for(var k = 0; k<preciosArray.length;k++){
                    
                    const id_producto_b = preciosArray[k].id_producto;
                    const precio_01 = preciosArray[k].precio_01;
                    const precio_02 = preciosArray[k].precio_02;
                    const precio_03 = preciosArray[k].precio_03;
                    const precio_04 = preciosArray[k].precio_04;
                    connection.query('Select twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_group from twofowg1_jepweb.ps_specific_price WHERE twofowg1_jepweb.ps_specific_price.id_product = ' + id_producto_b, (error_precio, result_precio) => {
                        if (!error_precio) {
                            if(result_precio.length > 1){
                                for (var l in result_precio) {
                                    //aqui los updates
                                    connection.query('UPDATE twofowg1_jepweb.ps_product SET price='+precio_01+' WHERE twofowg1_jepweb.ps_product.id_product = ' + String(id_producto_b).trim(), (error1, result1) => {
                                        if (!error1) {
                                            console.log(result1,id_producto_b);
                                        } else {
                                            console.log(error1);
                                        }
                                    });
                                    connection.query('UPDATE twofowg1_jepweb.ps_product_shop SET price='+precio_01+' WHERE twofowg1_jepweb.ps_product_shop.id_product  = ' + String(id_producto_b).trim(), (error2, result2) => {
                                        if (!error2) {
                                            console.log(result2,id_producto_b);
                                        } else {
                                            console.log(error2);
                                        }
                                    });
                                    connection.query('UPDATE twofowg1_jepweb.ps_specific_price SET price='+precio_01+' WHERE twofowg1_jepweb.ps_specific_price.id_product  = ' + String(id_producto_b).trim() + ' and twofowg1_jepweb.ps_specific_price.id_group=' + String(result_precio[l].id_group).trim(),(error2, result2) => {
                                        if (!error2) {
                                            console.log(result2,id_producto_b);
                                        } else {
                                            console.log(error2);
                                        }
                                    });
                                    connection.query('UPDATE twofowg1_jepweb.ps_specific_price SET price='+precio_02+' WHERE twofowg1_jepweb.ps_specific_price.id_product  = ' + String(id_producto_b).trim() + ' and twofowg1_jepweb.ps_specific_price.id_group=' + String(result_precio[l].id_group).trim(),(error2, result2) => {
                                        if (!error2) {
                                            console.log(result2,id_producto_b);
                                        } else {
                                            console.log(error2);
                                        }
                                    });
                                    connection.query('UPDATE twofowg1_jepweb.ps_specific_price SET price='+precio_03+' WHERE twofowg1_jepweb.ps_specific_price.id_product  = ' + String(id_producto_b).trim() + ' and twofowg1_jepweb.ps_specific_price.id_group=' + String(result_precio[l].id_group).trim(),(error2, result2) => {
                                        if (!error2) {
                                            console.log(result2,id_producto_b);
                                        } else {
                                            console.log(error2);
                                        }
                                    });
                                    //fin de los updates
                                }
                            }else{
                                //aqui los inserts
                                    connection.query('INSERT INTO twofowg1_jepweb.ps_specific_price (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) values ('+id_producto_b+',1,1,81,3,'+precio_01+',"amount")', (error3, result3) => {
                                        if (!error3) {
                                            console.log(result3,id_producto_b);
                                        } else {
                                            console.log(error3);
                                        }
                                    });
                                    connection.query('INSERT INTO twofowg1_jepweb.ps_specific_price (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) values ('+id_producto_b+',1,1,81,4,'+precio_02+',"amount")', (error4, result4) => {
                                        if (!error4) {
                                            console.log(result4,id_producto_b);
                                        } else {
                                            console.log(error4);
                                        }
                                    });
                                    connection.query('INSERT INTO twofowg1_jepweb.ps_specific_price (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) values ('+id_producto_b+',1,1,81,5,'+precio_03+',"amount")', (error5, result5) => {
                                        if (!error5) {
                                            console.log(result5,id_producto_b);
                                        } else {
                                            console.log(error5);
                                        }
                                    });
                                //aqui fin de los inserts
                            }
                    }else{
                        console.log(error);
                    }
                    });
                }
            });

            /*for (let h = 0; h < totalRecords; h++) {
                
                datosStock.push({
                    'idProductoStock' : String(sqlServerData[h].codigo).trim(),
                    'stock' : sqlServerData[h].existencia
                });
                idStock.push("'"+String(sqlServerData[h].codigo).trim()+"'");
            }
            const prstock = new Promise((resolve, reject) => {
                return connection.query('SELECT twofowg1_jepweb.ps_product.id_product,twofowg1_jepweb.ps_product.supplier_reference FROM twofowg1_jepweb.ps_product where twofowg1_jepweb.ps_product.supplier_reference in ('+idStock+');' , (error_stock, result_stock) => {
                    if (!error_stock) {
                        //console.log(result_stock);
                        for (var i in result_stock) {
                            for(var j = 0; j<datosStock.length; j++){
                                if(result_stock[i].supplier_reference == datosStock[j].idProductoStock){
                                    stockArray.push({
                                        'id_producto' : "'"+String(result_stock[i].id_product).trim()+"'",
                                        'stock' : datosStock[j].stock
                                    });
                                }
                            }
                        }
                    }
                    return resolve(stockArray);
                });
            });
            prstock.then(stockArray => {
                for (let m = 0; m < stockArray.length; m++) {
                    connection.query('UPDATE twofowg1_jepweb.ps_stock_available SET quantity='+stockArray[m].stock+' WHERE id_product =' + String(stockArray[m].id_producto).trim(), (error_stock2, result_stock2) => {
                        if (!error_stock2) {
                            console.log(result_stock2);
                        } else {
                            console.log(error_stock2);
                        }
                    });
                    if(stockArray.length==m){
                        console.log('proceso terminado');
                    }
                }
            });*/
            //res.json(preciosArray);
        }).catch(err => console.log(err));
});

var server = app.listen(port, function () {
    console.log('Conected...');
});
