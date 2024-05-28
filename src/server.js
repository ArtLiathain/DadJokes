const keyGen = require("./keyGen.js");
const level = require("level");
const { Level } = level;

import mysql from "mysql";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import argon2 from 'argon2';

const hostname = "localhost";
const port = 9022;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "art123",
  database: "Dadjokes",
});

// keyStoreLevelDB();

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

app.post("/addUser", async function (req, res) {
  if (req.body.pass) {
    try {
      // Should be stored in HSM
      let pepper = "TheLessYouKnow,ThePepper";
      const hash_result = await argon2.hash(req.body.pass, {secret: Buffer.from(pepper)});
      let sql = `INSERT INTO users
             VALUES ("${req.body.publickey}", "${req.body.user}", "${hash_result}")`;
      con.query(sql, function (err, result) {
        if (err) {
          return res.send({message: "Value already in database"});

        }
        console.log("1 record inserted");
        res.send({message: "Successfully added user"})
      });
    } catch (err) {
      console.log("Error hashing password: ", err);
    }
  }
});

app.post("/validateUser", async (req, res) => {
      //logic for hashing with salt or something if needed
      let hash_db = `SELECT password
             FROM users
             WHERE username = "${req.body.user}";`
      // need to add support for pepper and salt maybe
      let pepper = "TheLessYouKnow,ThePepper";
      if (await argon2.verify(hash_db, req.body.pass,{secret: Buffer.from(pepper)})) {
        console.log("Password is correct");
      } else {
        console.log("Password is incorrect");
      }

      con.query(sql, (error, result) => {
      if (error) {
        console.log("error retrieving user");
        return res.status(400).json({error: "Invalid"});
      } else {
        res.json({message: "Valid user"});
      }
      })
    }
)

const upload = multer({ storage: storage });

app.post("/addFile", upload.single("file"), (req, res) => {
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
