import "dotenv/config";
import {
  authenticateToken,
  generateAccessToken,
  getTokenPayload,
} from "./JwtAuth.js";
import {createPrivateKey, createPublicKey} from './keyGen.js';
import mysql from "mysql";
import express from "express";
import multer from "multer";
import path from "path";
import pino from "pino";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { rateLimit } from "express-rate-limit";
import argon2 from 'argon2';


const hostname = "localhost";
const port = 9022;
const logger = pino();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 5 minutes
  limit: 5, // each IP can make up to 10 requests per `windowsMs` (5 minutes)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
  message: "Slow down Tommy you're going too fasht",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var con = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  pepper: process.env.pepper
});

con.connect(function (err) {
  if (err) throw err;
  logger.info("Connected!");
});

const app = express();
app.use(express.json());
app.use(limiter);

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
  let pass = null;
  let hash_db = `SELECT password
             FROM users
             WHERE publickey=?;`;
  con.query(hash_db, [req.body.publickey], async (err, rows) => {
    console.log(rows);
    console.log(err);
    if (err || rows.length == 0) {
      console.log("error retrieving user");
      console.log(err);
      return res.status(400).json({ error: "Error retrieving user" });
    } else {
      if (
        pass != null &&
        (await argon2.verify(pass, req.body.pass, {
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
  const params = getTokenPayload(req.headers["authorization"]);
  let sql = `INSERT INTO fileStorage VALUES ("${req.file.filename}","${req.body.topublickey}","${params.publicKey}");`;
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

app.get("/allfiles/:publickey", authenticateToken, (req, res) => {
  const params = getTokenPayload(req.headers["authorization"]);
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ${params.publicKey}`,
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

app.get("/downloadFile/:filename", authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ${params.publicKey} AND filename = ${filename}`,
    (err, rows) => {
      if (err) {
        console.log("File not found");
        return res.status(401).json({ error: "You don't havce access" });
      } else {
        res.download(filePath, (err) => {
          if (err) {
            logger.error("Error downloading the file: ", err);
            res.status(404).send("File not found");
          }
        });
      }
    }
  );
});

app.listen(port, hostname, () => {
  console.log("Server Listening on PORT:", port);
});

