var connection = require('./server');
var request = new mysql();
var con = new connection.con();
        // query to the database and get the records
        request.query("SELECT k.codemp, k.codalm, k.codart as codigo, ROUND(SUM(k.cantot * (44 - ASCII(t.sigdoc))), 2) AS exiact, SUM(k.costot * (44 - ASCII(t.sigdoc))) AS totcos FROM dbo.kardex AS k INNER JOIN dbo.kardex_tipo_doc AS t ON k.tipdoc = t.tipdoc GROUP BY k.codemp, k.codalm, k.codart", function (err, dark) {
            if (err) console.log(err)
            var resultados = dark.recordset;
            for(var i=0;i<resultados.length;i++){
                    var data={
                        price : resultados[i].totcos,
                        quantity: resultados[i].exiact
                    }
                    
                    con.query('UPDATE ps_product SET ? WHERE supplier_reference = "' + resultados[i].codigo+'"', data, function(error, result) {
                        if(error) {
                            throw error;
                        }
                        else {
                            var j=i++;
                            console.log(result);
                        }
                    });
            }        
                    // send records as a response
            //res.json(dark.recordsets);
             
        });