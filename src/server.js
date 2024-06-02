import "dotenv/config";
import { authenticateToken, generateAccessToken } from "./JwtAuth.js";
import mysql from "mysql";
import express from "express";
import multer from "multer";
import path from "path";
import pino from "pino";
import { fileURLToPath } from "url";
import { dirname } from "path";
import argon2 from "argon2";

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

app.post("/addUser", async function (req, res) {
  if (req.body.pass) {
    try {
      // Should be stored in HSM
      const hash_result = await argon2.hash(req.body.pass, {
        secret: Buffer.from(process.env.pepper),
      });
      let sql = "INSERT INTO users VALUES (?, ?, ?)";
      con.query(
        sql,
        [req.body.publickey, req.body.user, hash_result],
        function (err, result) {
          if (err) {
            console.log(err);
            return res.send({ message: "Value already in database" });
          }
          console.log("1 record inserted");
          res.send({ message: "Successfully added user" });
        }
      );
    } catch (err) {
      console.log("Error hashing password: ", err);
    }
  }
});

app.post("/validateUser", async (req, res) => {
  //logic for hashing with salt or something if needed
  let hash_db = `SELECT password
             FROM users
             WHERE publickey=?;`;
  con.query(hash_db, [req.body.publickey], async (err, rows) => {
    if (err || rows.length == 0) {
      console.log("error retrieving user");
      console.log(err);
      return res.status(400).json({ error: "Error retrieving user" });
    } else {
      if (
        rows.length != 0 &&
        (await argon2.verify(rows[0].password, req.body.pass, {
          secret: Buffer.from(process.env.pepper),
        }))
      ) {
        console.log("Password is correct");
        res.json({
          message: "Valid user",
          token: generateAccessToken({
            user: req.body.user,
            publicKey: req.body.publicKey,
          }),
        });
      } else {
        console.log("Password is incorrect");
        return res.status(400).json({ error: "Error retrieving user" });
      }
    }
  });
});

const upload = multer({ storage: storage });

app.post("/addFile", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  let sql = `INSERT INTO fileStorage VALUES (?, ?, ?);`;
  con.query(
    sql,
    [req.file.filename, req.body.topublickey, req.body.frompublickey],
    (err, result) => {
      if (err) {
        console.log(err);
        res.json({ message: "Value already in database" });
        return;
      }
      console.log("1 record inserted");
    }
  );

  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
  });
});

app.get("/allfiles/:publickey", (req, res) => {
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ?`,
    [req.params.publickey],
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
      logger.error("Error downloading the file: ", err);
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
