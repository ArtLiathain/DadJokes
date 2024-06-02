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
  if (err) {
    logger.error({ sqlError: err }, "Failed to connect to database");
    throw err;
  }
  logger.info("Connected to Database!");
});

const app = express();
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

app.post("/addUser", async function (req, res) {
  if (req.body.pass) {
    try {
      const hash_result = await argon2.hash(req.body.pass, {
        secret: Buffer.from(process.env.pepper),
      });
      let sql = "INSERT INTO users VALUES (?, ?, ?)";
      con.query(
        sql,
        [req.body.publickey, req.body.user, hash_result],
        function (err, result) {
          if (err) {
            logger.error({ sqlError: err }, "Error adding value to database");
            return res.status(400).send();
          }
          logger.info(`Inserted new user ${req.body.user}`);
          res.send({ message: "Successfully added user" });
        }
      );
    } catch (err) {
      logger.error({ Error: err }, "Error creating user password");
      res.status(500).send();
    }
  } else {
    res.status(400).send();
  }
});

app.post("/validateUser", async (req, res) => {
  let hash_db = `SELECT password
             FROM users
             WHERE publickey=?;`;
  con.query(hash_db, [req.body.publickey], async (err, rows) => {
    if (err || rows.length == 0) {
      logger.error({ sqlError: err }, "Error retrieving value from database");
      return res.status(400).json();
    } else {
      if (
        rows.length != 0 &&
        (await argon2.verify(rows[0].password, req.body.pass, {
          secret: Buffer.from(process.env.pepper),
        }))
      ) {
        logger.info(`User ${req.body.user} successfully logged in`);
        res.json({
          message: "Valid user",
          token: generateAccessToken({
            user: req.body.user,
            publicKey: req.body.publicKey,
          }),
        });
      } else {
        logger.warn(`Invalid login attempt on user ${req.body.user}`);
        return res.status(400).json();
      }
    }
  });
});

const upload = multer({ storage: storage });

app.post("/addFile", authenticateToken, upload.single("file"), (req, res) => {
  const tokenParams = extractJwtClaims(req.headers["authorization"]);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  let sql = `INSERT INTO fileStorage VALUES (?, ?, ?);`;
  con.query(
    sql,
    [req.file.filename, req.body.topublickey, tokenParams.frompublickey],
    (err, result) => {
      if (err) {
        logger.error({ sqlError: err }, "Error inserting filename");
        res.status(400).json();
        return;
      }
      logger.info(`File ${req.file.filename} inserted sucessfully`);
    }
  );

  res.status(200).json({
    message: "File uploaded successfully",
    filename: req.file.filename,
  });
});

app.get("/allfiles", authenticateToken, (req, res) => {
  const tokenParams = extractJwtClaims(req.headers["authorization"]);
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ?`,
    [tokenParams.publickey],
    (err, rows) => {
      if (err) {
        logger.error({ sqlError: err }, "error retrieving filenames");
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

app.get("/downloadFile/:filename", authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  const tokenParams = extractJwtClaims(req.headers["authorization"]);
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ? AND filename = ?`,
    [tokenParams.publickey, filename],
    (err, rows) => {
      if (err) {
        logger.error({ sqlError: err }, "Invalid download attempt");
        return res.status(400).json();
      }
    }
  );
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
