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
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
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
    // sqlServer
    const sqlServerPromise = new Promise((resolve, reject) => {
        new sql.ConnectionPool(config_sql).connect().then(pool => {
            //return pool.request().query('SELECT k.codart as codigo, ROUND(SUM(k.cantot * (44 - ASCII(t.sigdoc))), 2) AS exiact FROM dbo.kardex AS k INNER JOIN dbo.kardex_tipo_doc AS t ON k.tipdoc = t.tipdoc GROUP BY k.codemp, k.codalm, k.codart order by 1')
            return pool.request().query('select k.codart as codigo, ROUND(SUM(k.cantot * (44 - ASCII(t.sigdoc))), 2) AS exiact from kardex k, kardex_tipo_doc t where k.tipdoc = t.tipdoc and k.codemp=16 GROUP BY k.codemp, k.codalm, k.codart order by 1;')
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
    

    console.log('iniciandose espere por favor');
    Promise.all([sqlServerPromise, sqlServerProducts, sqlServerClients]).then(results => {
        const sqlServerData = results[0];
        const sqlServerDataProducts = results[1];
        const sqlServerDataClients = results[2];
        const totalRecords = sqlServerData.length;
        const totalRecordsProducts = sqlServerDataProducts.length;
        const totalRecordsClients = sqlServerDataClients.length;
        const updates = [];
        const codart = [];
        const id_productos = [];
        const idsces = [];
        //var MD5 = function(d){result = M(V(Y(X(d),8*d.length)));return result.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

        for (let j = 0; j < totalRecordsProducts; j++) {
            codart.push({
                'id_productosdark' : String(sqlServerDataProducts[j].codart).trim(),
                'price_01' : sqlServerDataProducts[j].prec01,
                'price_02' : sqlServerDataProducts[j].prec02,
                'price_03' : sqlServerDataProducts[j].prec03,
                'price_04' : sqlServerDataProducts[j].prec04
            });
        }
        
        /*
        ingerso de clientes en la base falta pulir detalles como first name vacios, secure_key a que hace referencia
        */ 
       /*
        for (let k = 0; k < totalRecordsClients; k++) {
            const data = {
                id_shop_group : 1,
                id_shop : 1, 
                id_gender : 1,
                id_default_group : 3,
                id_lang : 1,
                id_risk : 1,
                company : sqlServerDataClients[k].nomcli,
                firstname : sqlServerDataClients[k].repcli,
                email : sqlServerDataClients[k].email,
                passwd : MD5(sqlServerDataClients[k].rucced)
            };
            
            mysqlCon.query('Select id_customer,email from ps_customer WHERE email = "' + sqlServerDataClients[k].email + '"', (error, result) => {
                if (!error) {
                    console.log(result.length);
                    if(result.length){
                        for (var i in result) {
                            console.log('Post Titles: ', result[i].email);
                            mysqlCon.query('UPDATE ps_stock_available SET ? WHERE id_customer = "' + String(result[i].id_customer).trim() + '"', data, (error2, result2) => {
                                if (!error2) {
                                    console.log(result2);
                                } else {
                                    console.log(error2);
                                }
                            });
                        }
                    }else{
                        console.log('nuevo');
                        mysqlCon.query('INSERT INTO ps_customer SET ?', data, (error2, result2) => {
                            if (!error2) {
                                console.log(result2);
                            } else {
                                console.log(error2);
                            }
                        });
                    }
                } else {
                    console.log(error);
                }
            });
            
        }
        */
        /*
        Precios
        UPDATE ps_product_shop set price = 22 where ps_product_shop.id_product = 1;
        UPDATE ps_product set price = 22 where ps_product.id_product = 1;
        select * from ps_specific_price

        Stock
        UPDATE ps_product SET quantity= 10 WHERE ps_product.id_product =1;
        UPDATE ps_stock_available SET quantity= 10 WHERE ps_stock_available.id_product =1;
        *//*
    for(let k = 0; k<codart.length; k++){
        const data = {
            price: codart[k].price_01,
        };
        
        connection.query('SELECT twofowg1_jepweb.ps_product.id_product FROM twofowg1_jepweb.ps_product where twofowg1_jepweb.ps_product.supplier_reference = "'+codart[k].id_productosdark+'" limit 1;' , (error_prod, result_prod) => {
            if (!error_prod) {
                
                for (var i in result_prod) {
                    if(result_prod[i].id_product){
                        connection.query('Select twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_group from twofowg1_jepweb.ps_specific_price WHERE twofowg1_jepweb.ps_specific_price.id_product = ' + result_prod[i].id_product, (error, result_precio) => {
                            if (!error) {
                                    if(result_precio.length > 1){
                                        for (var l in result_precio) {
                                            //aqui los updates
                                            connection.query('UPDATE twofowg1_jepweb.ps_product SET ? WHERE twofowg1_jepweb.ps_product.id_product = ' + String(result_prod[i].id_product).trim(), data, (error1, result1) => {
                                                if (!error1) {
                                                    console.log(result1);
                                                } else {
                                                    console.log(error1);
                                                }
                                            });
                                            connection.query('UPDATE twofowg1_jepweb.ps_product_shop SET ? WHERE twofowg1_jepweb.ps_product_shop.id_product  = ' + String(result_prod[i].id_product).trim(), data,(error2, result2) => {
                                                if (!error2) {
                                                    console.log(result2);
                                                } else {
                                                    console.log(error2);
                                                }
                                            });
                                            connection.query('UPDATE twofowg1_jepweb.ps_specific_price SET ? WHERE twofowg1_jepweb.ps_specific_price.id_product  = ' + String(result_prod[i].id_product).trim() + ' and twofowg1_jepweb.ps_specific_price.id_group=' + String(result_precio[l].id_group).trim(), data,(error2, result2) => {
                                                if (!error2) {
                                                    console.log(result2);
                                                } else {
                                                    console.log(error2);
                                                }
                                            });
                                            //fin de los updates
                                        }
                                    }else{
                                        //aqui los inserts
                                        if(codart[k].price_01 != undefined){
                                            connection.query('INSERT INTO twofowg1_jepweb.ps_specific_price (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) values ('+result_prod[i].id_product+',1,1,81,3,'+codart[k].price_01+',"amount")', (error3, result3) => {
                                                if (!error3) {
                                                    console.log(result3);
                                                } else {
                                                    console.log(error3);
                                                }
                                            });
                                        }
                                        if(codart[k].price_02 != undefined){
                                            connection.query('INSERT INTO twofowg1_jepweb.ps_specific_price (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) values ('+result_prod[i].id_product+',1,1,81,4,'+codart[k].price_02+',"amount")', (error4, result4) => {
                                                if (!error4) {
                                                    console.log(result4);
                                                } else {
                                                    console.log(error4);
                                                }
                                            });
                                        }
                                        if(codart[k].price_03 != undefined){
                                            connection.query('INSERT INTO twofowg1_jepweb.ps_specific_price (twofowg1_jepweb.ps_specific_price.id_product,twofowg1_jepweb.ps_specific_price.id_shop,twofowg1_jepweb.ps_specific_price.id_currency,twofowg1_jepweb.ps_specific_price.id_country,twofowg1_jepweb.ps_specific_price.id_group,twofowg1_jepweb.ps_specific_price.price,twofowg1_jepweb.ps_specific_price.reduction_type) values ('+result_prod[i].id_product+',1,1,81,5,'+codart[k].price_03+',"amount")', (error5, result5) => {
                                                if (!error5) {
                                                    console.log(result5);
                                                } else {
                                                    console.log(error5);
                                                }
                                            });
                                        }
                                        //aqui fin de los inserts
                                    }
                            }else{
                                console.log(error);
                            }
                        });
                    }else{
                        console.log('no hy');
                    }
                    ///fin de actualizacion de precios
                    //inicio de actualizacion de stock
                }
            }else{
                console.log(error_prod);
            }
            //console.log('terminado');
        });
    }
        */
        for (let m = 0; m < totalRecords; m++) {
            const data = {
                quantity: sqlServerData[m].exiact
            };
            //console.log('SELECT twofowg1_jepweb.ps_product.id_product FROM twofowg1_jepweb.ps_product where twofowg1_jepweb.ps_product.supplier_reference = "'+ String(sqlServerData[m].codigo).trim()+'" limit 1;');
            connection.query('SELECT twofowg1_jepweb.ps_product.id_product FROM twofowg1_jepweb.ps_product where twofowg1_jepweb.ps_product.supplier_reference = "'+ String(sqlServerData[m].codigo).trim()+'" limit 1;' , (error_stock, result_stock) => {
                if (!error_stock) {
                    for (var n in result_stock) {
                        if(result_stock[n].id_product){
                            connection.query('UPDATE twofowg1_jepweb.ps_stock_available SET ? WHERE id_product = "' + String(result_stock[n].id_product).trim() + '"', data, (error_stock2, result_stock2) => {
                            if (!error_stock2) {
                                console.log(result_stock2);
                            } else {
                                console.log(error_stock2);
                            }
                        });
                        }else{
                            console.log('no se encotro el producto '+result[i].id_product);
                        }
            
                    }
                }
            });
            console.log('terminado');
        }
        res.json(codart);
        
    }).catch(err => console.log(err));

});

var server = app.listen(port, function () {
    console.log('Conected...');
});
