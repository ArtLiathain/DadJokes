const { createServer } = require("node:http");
const { URL } = require("url");
const querystring = require("querystring");
const crypto = require("crypto");
var mysql = require("mysql");
const express = require("express");



const hostname = "localhost";
const port = 9022;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "art123",
  database: "Dadjokes",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

const app = express ();
app.use(express.json());

app.post('/addUser', function(req, res) {
  let pepper = "NoDictionaryTablesForYou"
  var sql =
  `INSERT INTO users VALUES ("${req.body.publickey}", "${req.body.user}", "${req.body.pass}","${req.body.salt}" ,"${pepper}")`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });  
  res.send(req.body);
});



app.listen(port, () => {
  console.log("Server Listening on PORT:", port);
});