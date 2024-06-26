import "dotenv/config";
import {
  authenticateToken,
  extractJwtClaims,
  generateAccessToken,
  getTokenFromAuthHeader,
} from "./JwtAuth.js";
import mysql from "mysql";
import express from "express";
import multer from "multer";
import path, { dirname } from "path";
import pino from "pino";
import { Level } from "level";
import { fileURLToPath } from "url";
import { rateLimit } from "express-rate-limit";
import argon2 from "argon2";
import { unlink } from "node:fs";

const hostname = process.env.domainname || "localhost";
const port = 9022;
const logger = pino();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 5 minutes
  limit: 20, // each IP can make up to 10 requests per `windowsMs` (5 minutes)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
  message: "Slow down Tommy you're going too fasht",
});

const db = new Level("example", { valueEncoding: "json" });
await db.open();
logger.info("Opened LevelDB");

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
app.set('trust proxy', 1);
app.use(limiter);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

app.get("/", (res, req) => {
  res.res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/view", (res, req) => {
  res.res.sendFile(path.join(__dirname, "viewfile.html"));
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
          // Add new publickey
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
      logger.error({ sqlError: err }, "Error retreving value from database");
      return res.status(400).send();
    } else {
      if (
        rows.length != 0 &&
        (await argon2.verify(rows[0].password, req.body.pass, {
          secret: Buffer.from(process.env.pepper),
        }))
      ) {
        logger.info(`Validated user ${req.body.publickey}`);
        res.json({
          message: "Valid user",
          token: generateAccessToken(req.body.publickey),
        });
      } else {
        logger.warn(`Invalid login attempt on user ${req.body.user}`);
        return res.status(400).send();
      }
    }
  });
});

const upload = multer({ storage: storage });

app.post("/addFile", authenticateToken, upload.single("file"), (req, res) => {
  const tokenParams = extractJwtClaims(getTokenFromAuthHeader(req.headers));
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (!req.body.topublickey) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  let sql = `INSERT INTO fileStorage VALUES (?, ?, ?, ?, ?, ?);`;
  con.query(
    sql,
    [
      req.file.filename,
      req.body.topublickey,
      tokenParams.publickey,
      req.body.iv,
      req.body.authHeader,
      req.body.sharedText,
    ],
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
  const tokenParams = extractJwtClaims(getTokenFromAuthHeader(req.headers));
  con.query(
    `SELECT filename, frompublickey, iv, authTag, sharedText from fileStorage WHERE topublickey = ?`,
    [tokenParams.publickey],
    (err, rows) => {
      if (err) {
        logger.error({ sqlError: err }, "error retrieving filenames");
        return res.status(400).json({ error: "No files found" });
      } else {
        let listOfFiles = [];
        for (let i = 0; i < rows.length; i++) {
          listOfFiles.push({
            filename: rows[i].filename,
            publickey: rows[i].frompublickey,
            iv: rows[i].iv,
            authTag: rows[i].authTag,
            sharedText: rows[i].sharedText,
          });
        }
        res.json({ files: listOfFiles });
      }
    }
  );
});

app.get("/downloadFile/:filename", authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", filename);
  const tokenParams = extractJwtClaims(getTokenFromAuthHeader(req.headers));
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ? AND filename = ?`,
    [tokenParams.publickey, filename],
    (err, rows) => {
      if (err || rows.length == 0) {
        logger.error({ sqlError: err }, "Invalid download attempt");
        return res.status(400).json();
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

app.get("/getallusers", authenticateToken, async (req, res) => {
  con.query(`SELECT username, publickey from users`, (err, rows) => {
    if (err) {
      logger.error({ sqlError: err }, "error retrieving filenames");
      return res.status(400).json({ error: "No files found" });
    } else {
      let listOfUsers = [];
      for (let i = 0; i < rows.length; i++) {
        listOfUsers.push({
          username: rows[i].username,
          publickey: rows[i].publickey,
        });
      }
      res.json({ users: listOfUsers });
    }
  });
});

app.delete("/delete/:filename", authenticateToken, async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", filename);
  const tokenParams = extractJwtClaims(getTokenFromAuthHeader(req.headers));
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ? AND filename = ?`,
    [tokenParams.publickey, filename],
    (err, rows) => {
      if (err || rows.length == 0) {
        logger.error({ sqlError: err }, "Invalid delete attempt");
        return res.status(400).json();
      } else {
        unlink(filePath, (err) => {
          if (err) throw err;
          logger.info(`${filename} was deleted`);
        });
      }
    }
  );

  con.query("DELETE FROM fileStorage WHERE filename=?", [filename], (err) => {
    if (err) {
      logger.error({ sqlError: err }, "Invalid download attempt");
      return res.status(400).json();
    }
  });
  res.send("File deleted");
});

const server = app.listen(port, hostname, () => {
  logger.info(`Server Listening on PORT: ${port}`);
});
export default server;
