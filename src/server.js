import "dotenv/config";
import { authenticateToken, generateAccessToken, extractJwtClaims } from "./JwtAuth.js";
import mysql from "mysql";
import express from "express";
import multer from "multer";
import path from "path";
import pino from "pino";
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

app.post("/addUser", function (req, res) {
  let sql = `INSERT INTO users VALUES ("${req.body.publickey}", "${req.body.user}", "${req.body.pass}")`;
  con.query(sql, function (err) {
    if (err) {
      return res.send({ message: "Value already in database" });
    }
    logger.info(`User with ${req.body.publickey} added`);
    res.send({ message: "Successfully added user" });
  });
});

app.post("/validateUser", (req, res) => {
  //logic for hashing with salt or somethign if needed
  let sql = `SELECT * FROM users WHERE username = "${req.body.user}" AND password = "${req.body.pass}";`;
  con.query(sql, (error) => {
    if (error) {
      logger.error({ sqlError: error }, "error retrieving user");
      return res.status(400).json({ error: "Invalid" });
    } else {
      logger.info("Sucessfully Logged in user");
      res.json({
        message: "Valid user",
        token: generateAccessToken({
          user: req.body.user,
          publicKey: "topublickey",
        }),
      });
    }
  });
});

const upload = multer({ storage: storage });

app.post("/addFile", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const tokenParams = extractJwtClaims(req.headers["authorization"])
  const sql = `INSERT INTO fileStorage VALUES ("${req.file.filename}","${req.body.topublickey}","${tokenParams.publicKey}");`;
  con.query(sql, (err, _result) => {
    if (err) {
      logger.error({ sqlError: err}, "error inserting publickeys");
      const filePath = path.join(__dirname, "uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error({ error: err }, "Error removing unuseable file");
          return;
        }
      });
      res.json({ message: "Error adding file" });
      return;
    }
  });

  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
  });
});

app.get("/allfiles", authenticateToken, (req, res) => {
  const tokenParams = extractJwtClaims(req.headers["authorization"])
  con.query(
    `SELECT filename from fileStorage WHERE topublickey = ${tokenParams.publicKey}`,
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

  res.download(filePath, (err) => {
    if (err) {
      logger.error({error: err}, "Error downloading file");
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
