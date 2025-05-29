var mysql = require('mysql');


//Menghubungkan DataBase 
var con = mysql.createConnection({
  host: "localhost", //Host nya
  user: "root", // Nama User nya
  password: "", // Password nya 
  database : "tugasakhir_cc"
});


con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});


module.exports = { con };
