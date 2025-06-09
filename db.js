var mysql = require('mysql2');


//Menghubungkan DataBase 
const con = mysql.createConnection({
  host: "database-4.c8nwws2ik3lf.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "Ramzi_240603",
  database: "tugasakhir_cc",
  port: 3306
});


con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});


module.exports = { con };
