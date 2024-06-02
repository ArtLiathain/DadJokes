import crypto from "crypto";

export const keyStoreLevelDB = async (db) => {
  const ecdh = crypto.createECDH("secp256k1");
  const keys = ecdh.generateKeys();
  const publicKey = keys.getPublicKey("base64");
  try {
    
    await db.put(`${publicKey} Public`, publicKey);
    await db.put(`${publicKey} Private`, keys.getPrivateKey("base64"));
    console.log("Successfully put Keys");
  } catch (error) {
    console.log(error);
  } finally {
    if (db) {
      await db.close();
      console.log("Closed LevelDB");
    }
  }
};
// var getPublicKey = await db.get("Username Public");
//     var getPrivateKey = await db.get("Username Private");

//     console.log("Public key Value", getPublicKey);
//     console.log("Private key Value", getPrivateKey);
