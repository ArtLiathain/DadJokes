import { generateAccessToken, verifyAccessToken } from "../JwtAuth";
import app from "../server";
import request from "supertest";
import path, { dirname } from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import mysql from "mysql";

beforeAll(async () => {
  const generatedScript = fs
    .readFileSync(path.join(__dirname, "../../SqlFiles/testServerDb.sql"))
    .toString();

  var db = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    multipleStatements: true,
  });
  await db.query(generatedScript, (err, result) => {
    if (err) {
      console.log(err);
      throw err;
    }
    return;
  });
});

afterAll(async () => {
  var db = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    multipleStatements: true,
  });
  await db.query("DROP TABLE fileStorage; DROP TABLE users;", (err, result) => {
    if (err) {
      console.log(err);
      throw err;
    }
  });
  return app.close();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.token = generateAccessToken(123456789);

describe("Get endpoints", () => {
  it("Should not get any files with certain publickey", async () => {
    const res = await request(app)
      .get("/allfiles")
      .set("Authorization", `Bearer ${global.token}`);
    console.log(res.body);
    expect(res.statusCode).toBe(400);
  });
  it("Should download a file and check its there", async () => {
    const res = await request(app)
      .post("/addFile")
      .attach("file", path.resolve(__dirname, "./testFile.txt"))
      .attach("topublickey", 123456789)
      .set("Authorization", `Bearer ${global.token}`);
    const getres = await request(app)
      .get(`/downloadFile/${res.body.filename}`)
      .set("Authorization", `Bearer ${global.token}`);
    expect(getres.statusCode).toBe(200);
  });
  it("Should get  files with certain publickey", async () => {
    const res = await request(app)
      .get("/allfiles")
      .set("Authorization", `Bearer ${global.token}`);
    console.log(res.body);
    expect(res.statusCode).toBe(200);
  });
});

describe("POST endpoints", () => {
  it("Should post a user to the database", async () => {
    const res = await request(app).post("/addUser").send({
      user: "Tommy",
      pass: "test is cool",
      publickey: 10987654321,
    });
    expect(res.statusCode).toEqual(200);
  });
  it("Should validate a user", async () => {
    const res = await request(app).post("/validateUser").send({
      pass: "test is cool",
      publickey: 10987654321,
    });
    expect(res.statusCode).toEqual(200);
    expect(verifyAccessToken(res.body.token).success).toEqual(true);
  });
  it("Should fail to validate a user", async () => {
    const res = await request(app).post("/validateUser").send({
      pass: "test isn't cool",
      publickey: 10987654321,
    });
    expect(res.statusCode).toEqual(400);
  });

  it("should upload a file successfully", async () => {
    const res = await request(app)
      .post("/addFile")
      .attach("file", path.resolve(__dirname, "./testFile.txt"))
      .attach("topublickey", 123456789)
      .set("Authorization", `Bearer ${global.token}`);

    // Check the response status and body
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "File uploaded successfully");
    expect(res.body).toHaveProperty("filename");
  });

  it("should return an error if no file is uploaded", async () => {
    const res = await request(app)
      .post("/addFile")
      .attach("topublickey", 123456789)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "No file uploaded");
  });
});

describe("Integration test fully", () => {
  it("Should do a full integration test", async () => {
    const addres = await request(app).post("/addUser").send({
      user: "Tommy",
      pass: "test is cool",
      publickey: 123455678910,
    });
    expect(addres.statusCode).toEqual(200);

    const valres = await request(app).post("/validateUser").send({
      pass: "test is cool",
      publickey: 123455678910,
    });
    expect(valres.statusCode).toEqual(200);
    expect(verifyAccessToken(valres.body.token).success).toEqual(true);
    const token = valres.body.token;
    const fileres = await request(app)
      .post("/addFile")
      .attach("file", path.resolve(__dirname, "./testFile.txt"))
      .attach("topublickey", 123455678910)
      .set("Authorization", `Bearer ${token}`);
    expect(fileres.statusCode).toEqual(200);

    const allres = await request(app)
      .get("/allfiles")
      .set("Authorization", `Bearer ${token}`);
    expect(allres.statusCode).toBe(200);

    const getres = await request(app)
      .get(`/downloadFile/${allres.body.files[0]}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getres.statusCode).toBe(200);
  });
});
