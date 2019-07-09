var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var sql = require('mssql');
const csv = require('fast-csv');
const fs = require('fs');

const config_sql = {
    user: 'darkvid',
    password: '1234',
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



const promisesSql = [sqlServerProducts];
const idsProductosPromise = Promise.all(promisesSql).then(results => {
    const productos = results[0];
    const columns = [
        { name: 'col1', label: 'Product ID' }, //null
        { name: 'col2', label: 'Active (0/1)' }, //1
        { name: 'col3', label: 'Name *' }, //nomcla+marca+nommod
        { name: 'col4', label: 'Categories (x,y,z...)' }, //2
        { name: 'col5', label: 'Price tax included' }, //precio_01 
        { name: 'col6', label: 'Tax rules ID' }, //1
        { name: 'col7', label: 'Wholesale price' }, //0
        { name: 'col8', label: 'On sale (0/1)' }, //1
        { name: 'col9', label: 'Discount amount' }, //vacio
        { name: 'col10', label: 'Discount percent' }, //vacio
        { name: 'col11', label: 'Discount from (yyyy-mm-dd)' }, //vacio
        { name: 'col12', label: 'Discount to (yyyy-mm-dd)' }, //vacio
        { name: 'col13', label: 'Reference #' }, //codalt
        { name: 'col14', label: 'Supplier reference #' }, //codart
        { name: 'col16', label: 'Supplier' }, //nompro
        { name: 'col17', label: 'Manufacturer' }, //nompro
        { name: 'col18', label: 'EAN13' }, //vacio
        { name: 'col19', label: 'UPC' }, //codfab
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
        { name: 'col30', label: 'Unity' }, //vacio
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
        { name: 'col48', label: 'Feature(Name:Value:Position)' }, //CATEGORIA:nomfam:0,SUBCATEGORIA:nombcla:1
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
    const rows = productos.map(producto => {
        return {
            ...producto,
            col1: 'NULL',
            col2: '1',
            col3: `${producto.nomcla} ${producto.marca} ${producto.nomart}`,
            col4: `1`,
            col5: `${producto.prec01}`,
            col6: `1`,
            col7: `0`,
            col8: `1`,
            col9: ``,
            col10: ``,
            col11: ``,
            col12: ``,
            col13: `${producto.codalt}`,
            col14: `${producto.codart}`,
            col16: `${producto.nompro}`,
            col17: `${producto.nompro}`,
            col18: ``,
            col19: `${producto.codfab}`,
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
            col30: ``,
            col31: ``,
            col32: ``,
            col33: ``,
            col34: `${producto.codfab} ${producto.codart}`,
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
            col45: `https://247.com.ec/jep/img/p/productos/0301010501.jpg,https://247.com.ec/jep/img/p/productos/0301010501.1.jpg,https://247.com.ec/jep/img/p/productos/0301010501.2.jpg`,
            col46: ``,
            col47: `1`,
            col48: `CATEGORIA:${producto.nomfam}:0,SUBCATEGORIA:${producto.nombcla}:1`,
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
        const filePathFromRoot = 'http://162.241.224.119/home1/twofowg1/public_html/prestatienda/csv_jep/';
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
            resolve({ fileName });
        });

        writableStream.on('error', (err) => {
            reject(err);
        });
    });
}