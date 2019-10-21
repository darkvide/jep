var express = require('express');
var app = express();
var sql = require('mssql');
var mysql = require('mysql');
const csv = require('fast-csv');
const fs = require('fs');
var PromiseFtp = require('promise-ftp');
var ftp = new PromiseFtp();
var Client = require('ftp');
var port = process.env.PORT || 5000;

/*INICIO DE CONEXIONES*/
/*CONEXION CON SQL*/
// const config_sql = {
//     user: 'darkvid',
//     password: '12345',
//     server: '127.0.0.1',
//     database: 'Kdbs_jep',
//     driver: 'tedious',
//     options: {
//         encrypt: false
//     },
//     connectionTimeout: 300000,
//     requestTimeout: 300000,
//     pool: {
//         idleTimeoutMillis: 300000,
//         max: 100
//     }
// };
/* CONEXION CON MYSQL*/
// var config_mysql_prod = {
//     host: "173.231.246.129",
//     user: "jepimp5_247",
//     password: "Gih{3x‾FRtrh",
//     database: "jepimp5_sbox"
// };

var config_mysql_prod = {
    host: "162.241.224.119",
    user: "twofowg1_WPYQG",
    password: "247Ec!!!!",
    database: "twofowg1_jepweb"
};

var config_sql_mysql = {
    host: "173.231.246.129",
    user: "jepimp5_darkvid",
    password: "De1234567890",
    database: "jepimp5_categories"
};
// var config_sql_mysql = {
//     host: "173.231.246.129",
//     user: "jepimp5_247",
//     password: "Gih{3x‾FRtrh",
//     database: "jepimp5_categories"
// };

var connection;
/** PROCESO PARA EVITAR CAIDA DE LA CONEXION MYSQL POR TIMEOUT TOMAR EN CUENTA QUE CUANDO UN QUERY ESTA DENTRO DE OTRO UTILIZAR CADA CON PARA UNA NUEVA CONSULTA
 * 
 * EJM
 * CONNECTION MYSQL(=>{
 * IF (SUCCESS){
 *  CON1.CONECTION(SQL.IDINSERTADO)
 * }
 * })
 */
function handleDisconnect() {
    connection = mysql.createConnection(config_mysql_prod);
    con2 = mysql.createConnection(config_mysql_prod);
    con3 = mysql.createConnection(config_mysql_prod);
    con4 = mysql.createConnection(config_mysql_prod);
    consql = mysql.createConnection(config_sql_mysql);
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
/**FIN DE CONEXIONES  */
/**INICIO DE CONSULTAS  */
// const sqlServerProducts = new Promise((resolve, reject) => {
//     new sql.ConnectionPool(config_sql).connect().then(pool => {
//         return pool.request().query(`SELECT codart,codalt,desart,nomart,nomcla,nomfam,marca,coduni,poriva,prec01,prec02,prec03,prec04,codpro,nompro,codfab,ultcos,cospro,exiact,estado
//         ,modbas
//         ,codmod
//         ,numbul FROM kdbs_jep.dbo.web_articulos where estado!=3 and marca is not null and modbas is  not null and codmod is not null `)
//     }).then(result => {
//         sql.close();
//         return resolve(result.recordset);
//     }).catch(err => {
//         //res.status(500).send({ message: "${err}" })
//         sql.close();
//     });
// });


const mysqlProductsPromise = new Promise((resolve, reject) => {
    return connection.query(`
        SELECT * 
        from ps_product 
        `, (error_product, result_product) => {
        if (!error_product) {
            return resolve(JSON.parse(JSON.stringify(result_product)));
        } else {
            console.log('ERROR"::::', error_product);
            return reject([]);
        }
    });
});

const sqlServerProducts = new Promise((resolve, reject) => {
    return consql.query(`
    SELECT codart,codalt,desart,nomart,nomcla,nomfam,marca,coduni,poriva,prec01,prec02,prec03,prec04,codpro,nompro,codfab,ultcos,cospro,exiact,estado
    ,modbas
    ,codmod
    ,numbul FROM v_articulos_jep where estado!=3 and marca is not null and modbas is  not null and codmod is not null 
        `, (error_product, result_product) => {
        if (!error_product) {
            return resolve(JSON.parse(JSON.stringify(result_product)));
        } else {
            console.log('ERROR"::::', error_product);
            return reject([]);
        }
    });
});

const mysqlCategoryPromise = new Promise((resolve, reject) => {
    return connection.query(`
        SELECT cat_lang.id_category as id_category_lang,cat_lang.name,cat_lang.description,
        (
            SELECT cat.id_parent FROM ps_category cat where cat.id_category=cat_lang.id_category limit 1
        ) as id_category
        from ps_category_lang cat_lang 
        `, (error_category, result_category) => {
        if (!error_category) {
            return resolve(JSON.parse(JSON.stringify(result_category)));
        } else {
            console.log('ERROR"::::', error_category);
            return reject([]);
        }
    });
});




/** INICIO DE INGRESO NUEVAS MARCAS MODELOS Y Aﾃ前S 
 * CATEGORIAS => tabla category_lang del prestashop (mysql)
 * PRODUCTOS => tabla productos originario de jep
 */

function limpiar(cadena) {
    if (cadena == null || cadena == undefined) {
        cadena = '';
    }
    return String(cadena).trim();
}

var m = new Date();
var hoy =
    m.getUTCFullYear() + "-" +
    ("0" + (m.getUTCMonth() + 1)).slice(-2) + "-" +
    ("0" + m.getUTCDate()).slice(-2) + " " +
    ("0" + m.getUTCHours()).slice(-2) + ":" +
    ("0" + m.getUTCMinutes()).slice(-2) + ":" +
    ("0" + m.getUTCSeconds()).slice(-2);

async function crearNuevos(categoriasMysql, productosSqlServer) {
    const nombresMarcas = [];
    const marcas = categoriasMysql.filter(marca => limpiar(marca.description) === '' && marca.id_category == 2).map(marca => {
        nombresMarcas.push(limpiar(marca.name));
        return {
            ...marca,
            name: limpiar(marca.name),
            description: limpiar(marca.description)
        };
    });

    const nuevasMarcasPromises = [];

    productosSqlServer.map(producto => {
        const nombreMarcas = limpiar(producto.marca).replace(/\//gi, ',').split(',');
        nombreMarcas
            .map(item => limpiar(item))
            .forEach(item => {
                if (nombresMarcas.indexOf(item) < 0) {
                    const pr = new Promise((resolve, reject) => {
                        const sql = `INSERT INTO ps_category 
                            (ps_category.id_parent,ps_category.id_shop_default,ps_category.level_depth,ps_category.nleft,ps_category.nright,ps_category.active,ps_category.date_add,ps_category.date_upd,ps_category.position,ps_category.is_root_category)
                            VALUES
                            (2,1,4,4000,40001,1,"${hoy}","${hoy}",0,0);
                        `;
                        connection.query(sql, (errorInsertMarca, insertMarca) => {
                            if (!errorInsertMarca) {
                                const sqlCategoryLang = `
                                INSERT INTO ps_category_lang  
                                    (ps_category_lang.id_category,ps_category_lang.id_shop,ps_category_lang.id_lang,ps_category_lang.name,ps_category_lang.description,ps_category_lang.link_rewrite,ps_category_lang.meta_title,ps_category_lang.meta_keywords,ps_category_lang.meta_description)
                                VALUES 
                                    (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `;
                                con2.query(sqlCategoryLang, [insertMarca.insertId, 1, 1, item, '', item.toLowerCase(), '', '', ''], (errorCategoryLang, insertCagegoryLang) => {
                                    marcas.push({
                                        id_category_lang: insertMarca.insertId,
                                        name: item,
                                        description: '',
                                        id_category: 2
                                    });
                                    resolve({
                                        id_category_lang: insertMarca.insertId,
                                        name: item,
                                        description: '',
                                        id_category: 2
                                    });
                                });
                            }
                        });
                    });
                    nuevasMarcasPromises.push(pr);
                }
            });
    });

    const idsMarcasInsertadas = await Promise.all(nuevasMarcasPromises);
    const modeloMarcas = await crearModelos(categoriasMysql, productosSqlServer, marcas);
    const listaAniosMysql = crearAnios(modeloMarcas, categoriasMysql, productosSqlServer, marcas);
    return Promise.resolve([productosSqlServer, listaAniosMysql]);
}

async function crearModelos(categoriasMysql, productosSqlServer, marcas) {
    const modeloMarca = {};
    productosSqlServer.forEach(modelo => {
        let itemModelos = [];
        if (modelo.modbas.indexOf('A/C') >= 0) {
            itemModelos = modelo.modbas.split(',');
        } else {
            itemModelos = modelo.modbas.replace(/\//gi, ',').split(',');
        }
        if (itemModelos)
            itemModelos.forEach(item => {
                modeloMarca[limpiar(item)] = modelo.marca;
            });
    });

    // sacar los modelos del sql server
    const nombresModelosSqlServer = [];
    [...new Set(productosSqlServer.map(producto => limpiar(producto.modbas)))]
    .map(modelo => {
        let itemModelos = [];
        if (modelo.indexOf('A/C') >= 0) {
            itemModelos = modelo.split(',');
        } else {
            itemModelos = modelo.replace(/\//gi, ',').split(',');
        }
        itemModelos.forEach(item => {
            nombresModelosSqlServer.push(limpiar(item));
        });
    });
    const modelosNoDuplicadosSSQL = [...new Set(nombresModelosSqlServer.filter(m => m))];

    const nombresModelos = [];
    const modelos = [];

    categoriasMysql
        .filter(item => limpiar(item.description) == '' && item.id_category != 2)
        .map(categoria => ({...categoria, name: limpiar(categoria.name) }))
        .map(categoria => {
            nombresModelos.push(categoria.name);
            modelos.push(categoria);
        });
    // validar cual de sqlServer no existe en mysql
    const nuevosModelosPorInsertar = modelosNoDuplicadosSSQL.filter(item => nombresModelos.indexOf(item) < 0);
    // insertar los que no existen
    let prs = [];
    prs = nuevosModelosPorInsertar.map(modelo => {
        return new Promise((resolve, reject) => {
            const marcaDatos = marcas.find(marca => marca.name == modeloMarca[modelo]);
            const sql = `
                INSERT INTO ps_category
                    (ps_category.id_parent,ps_category.id_shop_default,ps_category.level_depth,ps_category.nleft,ps_category.nright,ps_category.active,ps_category.date_add,ps_category.date_upd,ps_category.position,ps_category.is_root_category)
                VALUES
                    (${marcaDatos.id_category_lang}, 1, 4, 4000, 40001, 1,"${hoy}","${hoy}",0,0)`;
            con2.query(sql, (errorInsertModelo, insertModelo) => {
                if (!errorInsertModelo) {
                    con2.query(`INSERT INTO ps_category_lang  
                        (ps_category_lang.id_category,ps_category_lang.id_shop,ps_category_lang.id_lang,ps_category_lang.name,ps_category_lang.description,ps_category_lang.link_rewrite,ps_category_lang.meta_title,ps_category_lang.meta_keywords,ps_category_lang.meta_description)
                    VALUES 
                        (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [insertModelo.insertId, 1, 1, modelo, '', modelo.toLowerCase(), '', '', ''],
                        (error_category_lang, success_category_lang) => {
                            if (error_category_lang) {
                                console.log('error: ', insertModelo.insertId, modelo);
                            } else {
                                const modeloData = {
                                    id_category_lang: insertModelo.insertId,
                                    name: modelo,
                                    description: '',
                                    id_category: marcaDatos.id_category_lang
                                };
                                return resolve(modeloData);
                            }
                        });
                }
            });
        });
    });
    const nuevosModelosInsertados = await Promise.all(prs);
    return Promise.resolve([modeloMarca, [...modelos, ...nuevosModelosInsertados]]);
}

function crearAnios(modeloMarcas, categoriasMysql, productosSqlServer, marcas) {
    let ini = 0;
    let fin = 0;
    const listaAnios = [];
    let prsAnios = [];
    // lista de anios de sqlserver
    productosSqlServer.map(producto => {
        const nombreMarcas = limpiar(producto.marca).replace(/\//gi, ',').split(',');
        let ultimaMarca = nombreMarcas[0];
        const modelo = limpiar(producto.modbas);
        let itemModelos = [];
        if (modelo.indexOf('A/C') >= 0) {
            itemModelos = modelo.split(',');
        } else {
            itemModelos = modelo.replace(/\//gi, ',').split(',');
        }
        itemModelos.filter(m => limpiar(m)).forEach((modeloItem, indexModelo) => {
            if (limpiar(nombreMarcas[indexModelo]) != '') {
                ultimaMarca = limpiar(nombreMarcas[indexModelo]);
            }
            modeloItem = limpiar(modeloItem);
            const anio = limpiar(producto.codmod);
            const rangoSplit = anio.split('/');
            if (rangoSplit[0] != 'UNIVERSAL') {
                if (rangoSplit.length > 1) {
                    if (parseInt(rangoSplit[0]) >= parseInt(rangoSplit[1])) {
                        ini = parseInt(rangoSplit[1]);
                        fin = parseInt(rangoSplit[0]);
                    } else {
                        ini = parseInt(rangoSplit[0]);
                        fin = parseInt(rangoSplit[1]);
                    }
                } else {
                    ini = parseInt(rangoSplit[0]);
                    fin = parseInt(rangoSplit[0]);
                }
                for (var i = ini; i <= fin; i++) {
                    const dato = {
                        marca: ultimaMarca,
                        modelo: modeloItem,
                        codmod: producto.codmod,
                        description: `${ultimaMarca};${modeloItem};${producto.codmod}`,
                        anio: i,
                        rango: `${ini}/${fin}`
                    };
                    const exists = listaAnios.findIndex(item => item.description == dato.description && item.anio == dato.anio);
                    if (exists < 0) {
                        listaAnios.push(dato);
                    }
                }
            }
        });
    });
    /* ejemplo item listaAnios
    { 
        marca: 'CHEVROLET',
        modelo: 'CORSA',
        codmod: '1996/ 2000',
        description: 'CHEVROLET;CORSA;1996/ 2000',
        anio: 2000,
        rango: '1996/2000'
    } */
    const listadoAniosMysql = [];
    categoriasMysql
        .filter(item => limpiar(item.description) != '')
        .forEach(categoria => {
            const descrioptionSplit = limpiar(categoria.description).split(';');
            const anioMysql = `${descrioptionSplit[0] || ''}${(descrioptionSplit[1] ? ';' + descrioptionSplit[1] : '')}`
            listadoAniosMysql.push({
                ...categoria,
                marcaModelo: anioMysql,
                anio: categoria.name,
            });
        });
    // sacar lo que este en sqlserver que no este en mysql
    listaAnios.map(anioSqlServer => {
        const anioExists = listadoAniosMysql
            .find(anio =>
                anio.marcaModelo == anioSqlServer.marca + ';' + anioSqlServer.modelo &&
                anioSqlServer.anio == anio.anio
            );
        if (!anioExists) {
            // insertar los anios que no existen
            const findModelo = modeloMarcas[1].find(itemMod => itemMod.name == anioSqlServer.modelo);
            const sqlAnios = `
                INSERT INTO ps_category 
                    (ps_category.id_parent,ps_category.id_shop_default,ps_category.level_depth,ps_category.nleft,ps_category.nright,ps_category.active,ps_category.date_add,ps_category.date_upd,ps_category.position,ps_category.is_root_category)
                VALUES 
                    (${findModelo.id_category_lang},1,4,4000,40001,1,"${hoy}","${hoy}",0,0);
            `;
            connection.query(sqlAnios, (eerorAnios, successAnios) => {
                if (!eerorAnios) {
                    const sqlCategorylangAnios = `
                        INSERT INTO ps_category_lang  
                            (ps_category_lang.id_category,ps_category_lang.id_shop,ps_category_lang.id_lang,ps_category_lang.name,ps_category_lang.description,ps_category_lang.link_rewrite,ps_category_lang.meta_title,ps_category_lang.meta_keywords,ps_category_lang.meta_description)
                        VALUES 
                            (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    con2.query(
                        sqlCategorylangAnios, [successAnios.insertId, 1, 1, anioSqlServer.anio, anioSqlServer.marca + ';' + anioSqlServer.modelo + ';' + anioSqlServer.rango, anioSqlServer.anio, '', '', ''],
                        (errorAniosLang, insertLangAnios) => {
                            if (errorAniosLang) {
                                console.log(errorAniosLang);
                            }
                        }
                    );
                }
            });
        }
    });
    return listadoAniosMysql;
}

/** FIN DE INGRESO NUEVAS MARCAS MODELOS Y Aﾃ前S */


idsProductosPromise = Promise.all([sqlServerProducts, mysqlCategoryPromise, mysqlProductsPromise]).then(async(results) => {
    let productosSqlServer = results[0];
    let categorias = results[1] || [];

    // let productosmysql = results[2];
    // let familiacategorias;

    const nuevosPromise = crearNuevos(categorias, productosSqlServer);

    const productos = await Promise.all([nuevosPromise, mysqlProductsPromise]).then((productosActualizados) => {
        // listar nuevamente los productos
        const productReference = productosActualizados[1].map(
            ean => ean.reference
        );
        const nuevosproductos = productosActualizados[0][0].filter(
            producto => !productReference.includes(producto.codart.trim())
            //cliente => !userEMails.includes(cliente.campoEmailDeEstosRegistros)
        );
        const categoryLang = productosActualizados[0][1];

        const productos = nuevosproductos.map(producto => {
            return {
                ...producto,
                categorias: [...new Set(categoryLang.filter(categoria =>
                    String(`${producto.marca};${producto.modbas};${producto.codmod}`).toLowerCase().replace(/ /gi, '') === categoria.description.toLowerCase().replace(/ /gi, '')
                ).map(categoria => categoria.id_category))].join(','),
                familiacategorias: [...new Set(categoryLang.filter(categoria =>
                    `${producto.nomfam.toLowerCase().replace(/ /gi, '')};${producto.nomcla.toLowerCase().replace(/ /gi, '')}` === categoria.description.toLowerCase().replace(/ /gi, '')
                ).map(categoria => categoria.id_category))].join(',')
            };
        });
        return productos;
    });

    console.log('productos', productos.length);


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
    //const rows = productosSqlServer.map(producto => { descomentar esta linea si se desea el csv de todos los productos solo esta linea y comentar la linea anterior
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
            col1: ``,
            col2: 1,
            col3: `${mombreClase} ${producto.marca} ${producto.modbas} ${nombreLado}`,
            col4: `${producto.categorias},${producto.familiacategorias}`,
            col5: `${producto.prec01}`,
            col6: 1,
            col7: 0,
            col8: 1,
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
            col26: 1,
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
            col45: `https://jepimportaciones.com.ec/img/p/productos/${codigoProducto}.jpg`,
            col46: ``,
            col47: 1,
            col48: `CATEGORIA:${producto.nomfam}:0,SUBCATEGORIA:${mombreClase}:1`,
            col49: 0,
            col50: `new`,
            col51: 0,
            col52: 0,
            col53: 0,
            col54: 0,
            col55: 0,
            col56: 0,
            col57: 0,
            col58: 0,
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
            delimiter: ';',
            quote: ""
        });

        const writableStream = fs.createWriteStream(`${filePathFromRoot}${fileName}`, {
            //const writableStream = fs.createWriteStream(`${fileName}`, {
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
            var c = new Client();
            c.on('ready', function() {
                c.put(fileName, fileName, function(err) {
                    //console.log(fileName);
                    if (err) throw err;
                    c.end();
                });
            });
            // connect to localhost:21 as anonymous
            //c.connect();
            //c.connect({ host: 'jepimportaciones.com.ec', port: 21, secure: false, secureOptions: '', user: 'product_ftp_247@jepimportaciones.com.ec', password: 'd@c;ap={.gXu' });
            //ftp.connect({ host: '247.com.ec', user: 'destrella@247.com.ec', password: 'De1234567890' })
            /*ftp.connect({ host: 'jepimportaciones.com.ec', user: 'product_ftp_247@jepimportaciones.com.ec', password: 'd@c;ap={.gXu' })
                .then(function(serverMessage) {
                    console.log('Server message: ' + fileName);
                    return ftp.put(fileName, fileName);
                }).then(function() {
                    return ftp.end();
                });*/
            /*.then(function(serverMessage) {
                console.log('Server message: ' + serverMessage);
                return ftp.list('/');
            }).then(function(list) {
                console.log('Directory listing:');
                console.dir(list);
                return ftp.end();
            });*/
        });

        writableStream.on('error', (err) => {
            reject(err);
        });
    });
}