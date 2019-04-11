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
    database: "twofowg1_jepweb"
};
var config_mysql = {
    host: "localhost",
    user: "root",
    password: "",
    database: "prestatienda"
};


app.get('/', (req, res) => {
    // sqlServer
    const sqlServerPromise = new Promise((resolve, reject) => {
        new sql.ConnectionPool(config_sql).connect().then(pool => {
            return pool.request().query('SELECT k.codart as codigo, ROUND(SUM(k.cantot * (44 - ASCII(t.sigdoc))), 2) AS exiact FROM dbo.kardex AS k INNER JOIN dbo.kardex_tipo_doc AS t ON k.tipdoc = t.tipdoc GROUP BY k.codemp, k.codalm, k.codart')
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
    

    // mysql
    const mysqlPromise = new Promise((resolve, reject) => {
        const con = mysql.createConnection(config_mysql );
        return con.connect((err) => {
            if (err) reject(err);
            resolve(con);
        });
    });
    
    console.log('iniciandose espere por favor');
    Promise.all([sqlServerPromise, sqlServerProducts, sqlServerClients,mysqlPromise]).then(results => {
        const sqlServerData = results[0];
        const sqlServerDataProducts = results[1];
        const sqlServerDataClients = results[2];
        const mysqlCon = results[3];
        const totalRecords = sqlServerData.length;
        const totalRecordsProducts = sqlServerDataProducts.length;
        const totalRecordsClients = sqlServerDataClients.length;
        const updates = [];
        const errors = [];
        const idsces = [];
        var MD5 = function(d){result = M(V(Y(X(d),8*d.length)));return result.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}
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
        */
        for (let j = 0; j < totalRecordsProducts; j++) {
            const data = {
                price: sqlServerDataProducts[j].prec01,
            };
            mysqlCon.query('Select id_product from ps_product WHERE supplier_reference = "' + sqlServerDataProducts[j].codart + '"', (error, result) => {
                if (!error) {
                    if(result.length){
                        for (var i in result) {
                            console.log('Post Titles: ', result[i].id_product);
                            mysqlCon.query('UPDATE ps_product SET ? WHERE id_product = "' + String(result[i].id_product).trim() + '"', data, (error2, result2) => {
                                if (!error2) {
                                    console.log(result2);
                                } else {
                                    console.log(error2);
                                }
                            });
                            mysqlCon.query('UPDATE ps_product_shop SET ? WHERE id_product = "' + String(result[i].id_product).trim() + '"', data, (error2, result2) => {
                                if (!error2) {
                                    console.log(result2);
                                } else {
                                    console.log(error2);
                                }
                            });
                            mysqlCon.query('SELECT * from ps_specific_price WHERE id_product = "' + String(result[i].id_product).trim() + '"', data, (error, result_specific) => {
                                if (!error) {
                                    if(result_specific.length){
                                        for (var i in result_specific) {
                                            mysqlCon.query('UPDATE ps_specific_price SET price='+sqlServerDataProducts[j].prec01+' WHERE id_product = "' + String(result[i].id_product).trim() + '" and id_group=3', data, (error2, result2) => {
                                                if (!error2) {
                                                    console.log(result2);
                                                } else {
                                                    console.log(error2);
                                                }
                                            });
                                            mysqlCon.query('UPDATE ps_specific_price SET price='+sqlServerDataProducts[j].prec02+' WHERE id_product = "' + String(result[i].id_product).trim() + '" and id_group=4', data, (error2, result2) => {
                                                if (!error2) {
                                                    console.log(result2);
                                                } else {
                                                    console.log(error2);
                                                }
                                            });
                                            mysqlCon.query('UPDATE ps_specific_price SET price='+sqlServerDataProducts[j].prec03+' WHERE id_product = "' + String(result[i].id_product).trim() + '" and id_group=5', data, (error2, result2) => {
                                                if (!error2) {
                                                    console.log(result2);
                                                } else {
                                                    console.log(error2);
                                                }
                                            });
                                        }
                                    }else{
                                        mysqlCon.query('INSERT INTO ps_specific_price SET (id_product,id_shop,id_currency,id_country,id_group,price,reduction_type) value('+String(result[i].id_product).trim()+',1,1,81,3,'+sqlServerDataProducts[j].prec01+',"amount")', (error2, result2) => {
                                            if (!error2) {
                                                console.log(result2);
                                            } else {
                                                console.log(error2);
                                            }
                                        });
                                        mysqlCon.query('INSERT INTO ps_specific_price SET (id_product,id_shop,id_currency,id_country,id_group,price,reduction_type) value('+String(result[i].id_product).trim()+',1,1,81,4,'+sqlServerDataProducts[j].prec02+',"amount")', (error2, result2) => {
                                            if (!error2) {
                                                console.log(result2);
                                            } else {
                                                console.log(error2);
                                            }
                                        });
                                        mysqlCon.query('INSERT INTO ps_specific_price SET (id_product,id_shop,id_currency,id_country,id_group,price,reduction_type) value('+String(result[i].id_product).trim()+',1,1,81,5,'+sqlServerDataProducts[j].prec03+',"amount")', (error2, result2) => {
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
                  /*      }
                    }
                } else {
                    console.log(error);
                    //errors.push(error);
                }
            });
            
        }

        for (let k = 0; k < totalRecordsProducts; k++) {
            const data = {
                //price: sqlServerDataProducts[k].prec01,
                quantity: sqlServerData[k].exiact
            };
            mysqlCon.query('Select id_product from ps_product WHERE supplier_reference = "' + sqlServerDataProducts[k].codart + '"', (error, result) => {
                if (!error) {
                    if(result.length){
                        for (var i in result) {
                            console.log('Post Titles: ', result[i].id_product);
                            mysqlCon.query('UPDATE ps_stock_available SET ? WHERE id_product = "' + String(result[i].id_product).trim() + '"', data, (error2, result2) => {
                                if (!error2) {
                                    console.log(result2);
                                } else {
                                    console.log(error2);
                                }
                            });
                           /* mysqlCon.query('UPDATE ps_product SET ? WHERE id_product = "' + String(result[i].id_product).trim() + '"', data, (error, result2) => {
                                if (!error) {
                                    console.log(result2);
                                } else {
                                    console.log(error);
                                }
                            });*/
                 /*       }
                    }
                } else {
                    console.log(error);
                    //errors.push(error);
                }
            });
            
        }*/

        /*mysqlCon.end(function (err) {
            if (err) {
                return console.log('error:' + err.message);
            }
            console.log('Termino update id'+result[i].id_product);
        });*/
        //console.log(idsces);
        /*for (let j = 0; j < updates; j++) {
            const data = {
                //price: sqlServerData[i].totcos,
                quantity: sqlServerData[j].exiact
            };
            mysqlCon.query('UPDATE ps_product SET ? WHERE supplier_reference = "' + sqlServerData[j].codigo + '"', data, (error, result) => {
                if (!error) {
                    //console.log(result);
                    updates.push(result);
                } else {
                    //console.log(error);
                    errors.push(error);
                }
            });
        }
        /*for (let j = 0; j < totalRecords; j++) {
            const data = {
                //price: sqlServerData[i].totcos,
                quantity: sqlServerData[j].exiact
            };
            mysqlCon.query('UPDATE ps_product SET ? WHERE supplier_reference = "' + sqlServerData[j].codigo + '"', data, (error, result) => {
                if (!error) {
                    //console.log(result);
                    updates.push(result);
                } else {
                    //console.log(error);
                    errors.push(error);
                }
            });
        }*/
        // mysqlCon.end(function (err) {
        //     if (err) {
        //         return console.log('error:' + err.message);
        //     }
        //     console.log('Close the database connection.');
        // });
        
        res.json(updates);
    }).catch(err => console.log(err));
    console.log('terminado');
});

var server = app.listen(port, function () {
    console.log('Conected...');
});
