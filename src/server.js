import 'dotenv/config'
import {authenticateToken, generateAccessToken} from './JwtAuth.js'
import mysql from "mysql";
import express from "express";
import multer from "multer";
import path from "path";
import pino from 'pino';
import { fileURLToPath } from "url";
import { dirname } from "path";

const hostname = "localhost";
const port = 9022;
const logger = pino();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var con = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});


con.connect(function (err) {
  if (err) throw err;
  logger.info("Connected!");
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
  let sql = `INSERT INTO users VALUES ("${req.body.publickey}", "${req.body.user}", "${req.body.pass}","${req.body.salt}" ,"${pepper}")`;
  con.query(sql, function (err) {
    if (err) {
      return res.send({ message: "Value already in database" });
    }
    console.log("1 record inserted");
    res.send({ message: "Successfully added user" });
  });
});

app.post("/validateUser", (req, res) => {
  //logic for hashing with salt or somethign if needed
  let sql = `SELECT * FROM users WHERE username = "${req.body.user}" AND password = "${req.body.pass}";`;
  con.query(sql, (error) => {
    if (error) {
      console.log("error retrieving user");
      return res.status(400).json({ error: "Invalid" });
    } else {
      res.json({ message: "Valid user", token: generateAccessToken({user: req.body.user, publicKey: "1233455"})});
    }
  });
});

const upload = multer({ storage: storage });

app.post("/addFile",authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  let sql = `INSERT INTO fileStorage VALUES ("${req.file.filename}","${req.body.topublickey}","${req.body.frompublickey}");`;
  con.query(sql, (err, result) => {
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
    `SELECT filename from fileStorage WHERE topublickey = ${req.params.publickey}`,
    (err, rows) => {
      if (err) {
        console.log("error retrieving filenames");
        return res.status(400).json({ error: "No files found" });
      } else {
        let listOfFiles = [];
        for (let i = 0; i < rows.length; i++) {
          listOfFiles.push(rows[i].filename);
        }
        res.json({ files: listOfFiles });
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

app.listen(port, hostname, () => {
  console.log("Server Listening on PORT:", port);
});

async function keyStoreLevelDB() {
  var publicKey = keyGen.createPublicKey();
  var privateKey = keyGen.createPrivateKey();
  var db;

  try {
    db = new Level("example", { valueEncoding: "json" });

    await db.open();
    console.log("Opened LevelDB");

    await db.put("Username Public", publicKey);
    await db.put("Username Private", privateKey);
    console.log("Successfully put Keys");

    var getPublicKey = await db.get("Username Public");
    var getPrivateKey = await db.get("Username Private");

    console.log("Public key Value", getPublicKey);
    console.log("Private key Value", getPrivateKey);
  } catch (error) {
    console.log(error);
  } finally {
    if (db) {
      await db.close();
      console.log("Closed LevelDB");
    }
  }
}
