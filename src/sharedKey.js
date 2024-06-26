import crypto from "crypto";

export const deriveSharedKey = (publicKey, privateKey, sharedText) => {
  const ecdh = crypto.createECDH("secp256k1");
  ecdh.setPrivateKey(privateKey, "hex");

  const sharedSecret = ecdh.computeSecret(publicKey, "hex");

  // derive key using shared secret and shared text
  //maybe MD5?
  const hkdf = crypto.createHmac("sha256", sharedSecret);
  hkdf.update(sharedText);
  const derivedKey = hkdf.digest();

  return derivedKey;
};

// const key1 = deriveSharedKey(BobPublicKey, AlicePrivateKey, sharedText);
// const key2 = deriveSharedKey(AlicePublicKey, BobPrivateKey, sharedText);

// if (key1.equals(key2)) {
//     console.log("The derived keys match!");
// } else {
//     console.log("The derived keys do not match!");
// }

// console.log("Derived key 1 :", key1.toString('hex'));
// console.log("Derived key 2 :", key2.toString('hex'));
