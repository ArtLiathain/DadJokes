// import crypto from "crypto";
// import server from "./server";

export async function keyStoreLevelDB(username){
//   const ecdh = crypto.createECDH("secp256k1");
//   const keys = ecdh.generateKeys();
//   const publicKey = keys.getPublicKey("base64");
const crypto = window.crypto.subtle;
  const keys = await crypto.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256", // equivalent to secp256k1
    },
    true,
    ["deriveKey", "deriveBits"]
  );

const publicKey = await crypto.exportKey("raw", keys.publicKey);
const privateKey = await crypto.exportKey("raw", keys.privateKey);

  const db = server.db;
  try {
    
    await db.put(`${username} Public`, publicKey);
    await db.put(`${publicKey} Private`, privateKey); //keys.getPrivateKey("base64")
    console.log("Successfully put Keys");
  } catch (error) {
    console.log(error);
  } finally {
    if (db) {
      await db.close();
      console.log("Closed LevelDB");
    }
  }
  return publicKey;
};
// var getPublicKey = await db.get("Username Public");
//     var getPrivateKey = await db.get("Username Private");

//     console.log("Public key Value", getPublicKey);
//     console.log("Private key Value", getPrivateKey);
