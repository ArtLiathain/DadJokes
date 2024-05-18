var mysql = require("mysql");
const express = require("express");
const querystring = require("querystring");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");

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

const app = express();
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + ":" + file.originalname);
  },
});

app.post("/addUser", function (req, res) {
  let pepper = "NoDictionaryTablesForYou";
  var sql = `INSERT INTO users VALUES ("${req.body.publickey}", "${req.body.user}", "${req.body.pass}","${req.body.salt}" ,"${pepper}")`;
  con.query(sql, function (err, result) {
    if (err) {
      res.send({ message: "Value already in database" });
      return;
    }
    console.log("1 record inserted");
  });
});

const upload = multer({ storage: storage });

app.post("/addFile", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log(`INSERT INTO fileStorage VALUES ("${req.file.filename}","${req.body.publickey}");`);
  var sql = `INSERT INTO fileStorage VALUES ("${req.file.filename}","${req.body.publickey}");`;
  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({ message: "Value already in database" });

      return;
    }
    console.log("1 record inserted");
  });

  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
  });
});

app.get("/allfiles/:publickey", (req, res) => {
  con.query(
    `SELECT filename from fileStorage WHERE publickey = ${req.params.publickey}`,
    (err, rows) => {
      if (err) {
        console.log("error retrieving filenames");
        return res.status(400).json({ error: "No files found" });
      } else {
        let listOfFiles = [];
        for (i = 0; i < rows.length; i++) {
          listOfFiles.push(rows[i].filename);
        }
        res.json({files : listOfFiles});
      }
    }
  );
});

app.get("/downloadFile/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error("Error downloading the file: ", err);
      res.status(404).send("File not found");
    }
  });
});

app.listen(port, () => {
  console.log("Server Listening on PORT:", port);
});
