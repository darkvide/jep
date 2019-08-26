var express = require('express');
var app = express();
var sql = require('mssql');
var mysql = require('mysql');
const csv = require('fast-csv');
const fs = require('fs');
var PromiseFtp = require('promise-ftp');
var ftp = new PromiseFtp();
var port = process.env.PORT || 5000;

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

// var config_mysql_prod = {
//     host: "162.241.224.119",
//     user: "twofowg1_WPYQG",
//     password: "247Ec!!!!",
//     database: "twofowg1_jepweb"
// };

var config_mysql_prod = {
    host: "173.231.246.129",
    user: "jepimp5_jpreues",
    password: "xEf;XB2LIMWf",
    database: "jepimp5_cmmpje"
};

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

const mysqlCategoryPromise = new Promise((resolve, reject) => {
    return connection.query(`
        SELECT * 
        from ps_category_lang 
        `, (error_category, result_category) => {
        if (!error_category) {
            return resolve(JSON.parse(JSON.stringify(result_category)));
        } else {
            console.log('ERROR"::::', error_category);
            return reject([]);
        }
    });
});


const promisesSql = [sqlServerProducts, mysqlCategoryPromise];
idsProductosPromise = Promise.all(promisesSql).then(results => {
    let productos = results[0];
    let categorias = results[1] || [];
    let familiacategorias;
    productos = productos.map(producto => {
        return {
            ...producto,
            categorias: categorias.filter(categoria =>
                `${producto.marca};${producto.modbas};${producto.codmod}`.toLowerCase().replace(/ /gi, '') === categoria.description.toLowerCase().replace(/ /gi, '')
            ).map(categoria => categoria.id_category).join(','),
            familiacategorias: categorias.filter(categoria =>
                    `${producto.nomfam.toLowerCase().replace(/ /gi, '')};${producto.nomcla.toLowerCase().replace(/ /gi, '')}` === categoria.description.toLowerCase().replace(/ /gi, '')
                ).map(categoria => categoria.id_category).join(',')
                /*categorias: categorias.filter(categoria => {
                    console.log(
                        `${producto.codart.toLowerCase().replace(/ /gi, '')};${producto.nomfam.toLowerCase().replace(/ /gi, '')};${producto.nomcla.toLowerCase().replace(/ /gi, '')}`,
                        categoria.description.toLowerCase().replace(/ /gi, '')
                    );
                    return `${producto.nomfam.toLowerCase().replace(/ /gi, '')};${producto.nomcla.toLowerCase().replace(/ /gi, '')}` ===
                        categoria.description.toLowerCase().replace(/ /gi, '')
                })*/
        };
    });


    const columns = [
        { name: 'col1', label: 'Product ID' }, //null
        { name: 'col2', label: 'Active (0/1)' }, //1
        { name: 'col3', label: 'Name *' }, //nomcla+marca+nommod+codart01 izquierdo 02 derecho(mayusculas)
        { name: 'col4', label: 'Categories (x,y,z...)' }, //2
        { name: 'col5', label: 'Price tax included' }, //precio_01 
        { name: 'col6', label: 'Tax rules ID' }, //1
        { name: 'col7', label: 'Wholesale price' }, //0
        { name: 'col8', label: 'On sale (0/1)' }, //1
        { name: 'col9', label: 'Discount amount' }, //vacio
        { name: 'col10', label: 'Discount percent' }, //vacio
        { name: 'col11', label: 'Discount from (yyyy-mm-dd)' }, //vacio
        { name: 'col12', label: 'Discount to (yyyy-mm-dd)' }, //vacio
        { name: 'col13', label: 'Reference #' }, //codart
        { name: 'col14', label: 'Supplier reference #' }, //codfab
        { name: 'col16', label: 'Supplier' }, //nompro
        { name: 'col17', label: 'Manufacturer' }, //nompro
        { name: 'col18', label: 'EAN13' }, //codmod sin "/" ejemplo 2001/2009 == 20012009 
        { name: 'col19', label: 'UPC' }, //codalt
        { name: 'col20', label: 'Ecotax' }, //vacio
        { name: 'col21', label: 'Width' }, //vacio
        { name: 'col22', label: 'Height' }, //vacio
        { name: 'col23', label: 'Depth' }, //vacio
        { name: 'col24', label: 'Weight' }, //vacio
        { name: 'col25', label: 'Quantity' }, //exiact
        { name: 'col26', label: 'Minimal quantity' }, //1
        { name: 'col27', label: 'Low stock level' }, //vacio
        { name: 'col28', label: 'Visibility' }, //vacio
        { name: 'col29', label: 'Additional shipping cost' }, //vacio
        { name: 'col30', label: 'Unity' }, //numbul
        { name: 'col31', label: 'Unit price' }, //vacio
        { name: 'col32', label: 'Short description' }, //vacio
        { name: 'col33', label: 'Description' }, //vacio
        { name: 'col34', label: 'Tags (x,y,z)' }, //codart,codfab
        { name: 'col35', label: 'Meta title' }, //vacio
        { name: 'col36', label: 'Meta keywords' }, //vacio
        { name: 'col37', label: 'Meta description' }, //vacio
        { name: 'col38', label: 'URL rewritten' }, //vacio
        { name: 'col39', label: 'Text when in stock' }, //vacio
        { name: 'col40', label: 'Text when backorder allowed' }, //vacio
        { name: 'col41', label: 'Available for order (0 = No, 1 = Yes)' }, //vacio
        { name: 'col42', label: 'Product available date' }, //vacio
        { name: 'col43', label: 'Product creation date' }, //vacio
        { name: 'col44', label: 'Show price (0 = No, 1 = Yes)' }, //vacio
        { name: 'col45', label: 'Image URLs (x,y,z...)' }, //url de imagen de ejemplo
        { name: 'col46', label: 'Image alt texts (x,y,z...)' }, //blanco
        { name: 'col47', label: 'Delete existing images (0 = No, 1 = Yes)' }, //1
        { name: 'col48', label: 'Feature(Name:Value:Position)' }, //CATEGORIA:nomfam:0,SUBCATEGORIA:nomcla:1
        { name: 'col49', label: 'Available online only (0 = No, 1 = Yes)' }, // 0
        { name: 'col50', label: 'Condition' }, //new
        { name: 'col51', label: 'Customizable (0 = No, 1 = Yes)' }, // 0
        { name: 'col52', label: 'Uploadable files (0 = No, 1 = Yes)' }, // 0
        { name: 'col53', label: 'Text fields (0 = No, 1 = Yes)' }, // 0
        { name: 'col54', label: 'Out of stock' }, // 0
        { name: 'col55', label: 'ID / Name of shop' }, // 0
        { name: 'col56', label: 'Advanced stock management' }, // 0
        { name: 'col57', label: 'Depends On Stock' }, // 0
        { name: 'col58', label: 'Warehouse' } //0
    ];
    var productosFlat = [];
    productos.filter(producto => producto.marca && producto.modbas).forEach(producto => {
        // split modbas for iterate in more lines

        //var modbas = producto.modbas.trim().split(', ');
        //var marca = producto.marca.split(', ');
        var modbas = producto.modbas.trim();
        modbas = modbas.replace('/', ',').replace(' ,', ',').replace(', ', ',').split(',');
        var marca = producto.marca.split('/').join(', ').split(', ');
        modbas.forEach((item, index) => {
            productosFlat.push({
                ...producto,
                modbas: item,
                marca: marca[index] || marca[0]
            });
        });

    });

    const rows = productosFlat.map(producto => {
        //console.log(producto.codart, 'dark ', producto.familiacategorias);
        if (producto.codfab && producto.codfab != null) {
            var codigoFabrica = producto.codfab.trim();
        }
        if (producto.nomcla && producto.nomcla != null) {
            var mombreClase = producto.nomcla.trim();
        }
        if (producto.codalt && producto.codalt != null) {
            var codigoAlternativo = producto.codalt.trim();
        }
        if (producto.nompro && producto.nompro != null) {
            var codigoProveedor = producto.nompro.trim();
        }
        if (producto.codart && producto.codart != null) {
            var codigoProducto = producto.codart.trim();
            var lado = codigoProducto.substr(-2);
            if (lado == 01) {
                nombreLado = 'IZQUIERDO';
            } else if (lado == 02) {
                nombreLado = 'DERECHO';
            } else {
                nombreLado = '';
            }
        }
        return {
            ...producto,
            col1: 'NULL',
            col2: '1',
            col3: `${producto.nomcla} ${producto.marca} ${producto.modbas} ${nombreLado}`,
            col4: `${producto.categorias},${producto.familiacategorias}`,
            col5: `${producto.prec01}`,
            col6: `1`,
            col7: `0`,
            col8: `1`,
            col9: ``,
            col10: ``,
            col11: `${producto.marca}`,
            col12: `${producto.modbas}`,
            col13: `${codigoProducto}`,
            col14: `${codigoFabrica}`,
            col16: `${codigoProveedor}`,
            col17: `${codigoProveedor}`,
            col18: ``,
            col19: `${codigoAlternativo}`,
            col20: ``,
            col21: ``,
            col22: ``,
            col23: ``,
            col24: ``,
            col25: `${producto.exiact}`,
            col26: `1`,
            col27: ``,
            col28: ``,
            col29: ``,
            col30: `${producto.numbul}`,
            col31: ``,
            col32: `${producto.codmod}`,
            col33: ``,
            col34: `${codigoFabrica},${codigoProducto}`,
            col35: ``,
            col36: ``,
            col37: ``,
            col38: ``,
            col39: ``,
            col40: ``,
            col41: ``,
            col42: ``,
            col43: ``,
            col44: ``,
            col45: `https://247.com.ec/jep/img/p/productos/${codigoProducto}.jpg`,
            col46: ``,
            col47: `1`,
            col48: `CATEGORIA:${producto.nomfam}:0,SUBCATEGORIA:${mombreClase}:1`,
            col49: `0`,
            col50: `new`,
            col51: `0`,
            col52: `0`,
            col53: `0`,
            col54: `0`,
            col55: `0`,
            col56: `0`,
            col57: `0`,
            col58: `0`,
        };
    });
    generateCsv(columns, rows, 'productos-jep.csv').then(result => console.log(result));
});

function generateCsv(columns, rows, fileName) {
    return new Promise((resolve, reject) => {
        const filePathFromRoot = __dirname + '/csv/';
        const csvStream = csv.format({
            headers: true,
            quoteColumns: true,
            quoteHeaders: true,
        });

        const writableStream = fs.createWriteStream(`${filePathFromRoot}${fileName}`, {
            encoding: 'utf8',
        });

        csvStream.pipe(writableStream);
        // prepare data to get the same format as view
        const csvHeaders = columns.map(col => col.label);
        csvStream.write(csvHeaders);

        if (rows && rows.length > 0) {
            rows.forEach(item => {
                const currentRow = [];
                columns.forEach(col => {
                    currentRow.push(item[col.name]);
                });
                csvStream.write(currentRow);
            });
        }
        csvStream.end();

        writableStream.on('finish', () => {
            /*resolve({ fileName });
            var c = new Client();
            c.on('ready', function() {
                c.put(fileName, fileName, function(err) {
                    if (err) throw err;
                    c.end();
                });
            });*/
            // connect to localhost:21 as anonymous
            // c.connect();
            ftp.connect({ host: '247.com.ec', user: 'destrella@247.com.ec', password: 'De1234567890' })
                .then(function(serverMessage) {
                    console.log('Server message: ' + fileName);
                    return ftp.put(fileName, 'darktest/' + fileName);
                }).then(function() {
                    return ftp.end();
                });
        });

        //writableStream.on('error', (err) => {
        //reject(err);
        //});
    });
}