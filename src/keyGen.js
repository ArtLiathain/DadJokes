import crypto from "crypto";

const ecdh = crypto.createECDH("secp256k1");
ecdh.generateKeys();

export function createPublicKey() {
  return ecdh.getPublicKey("hex");
}

export function createPrivateKey() {
  return ecdh.getPrivateKey("hex");
}

async function keyStoreLevelDB() {
  var publicKey = createPublicKey();
  var privateKey = createPrivateKey();
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
