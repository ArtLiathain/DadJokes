import crypto from 'crypto';

function encryptText(derivedKey, text) {
    const iv = crypto.randomBytes(12); // IV 12 bytes (96 bits)
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64'); // plaintext utf8 to ciphertext base64  
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    return { iv: iv.toString('base64'), encrypted, authTag };
}

function decryptText(derivedKey, ivBase64, encryptedText, authTagBase64) {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'base64', 'utf8'); // ciphertext base64 to plaintext utf8
    decrypted += decipher.final('utf8');
    return decrypted;
}



// // Function to derive a shared key
// function deriveSharedKey(privateKeyHex, publicKeyHex, sharedText) {
//     const ecdh = crypto.createECDH('secp256k1');
//     ecdh.setPrivateKey(privateKeyHex, 'base64');
//     const sharedSecret = ecdh.computeSecret(publicKeyHex, 'base64');
//     const hkdf = crypto.createHmac('sha256', sharedSecret);
//     hkdf.update(sharedText);
//     return hkdf.digest();
// }

// // Example usage
// const alice = crypto.createECDH('secp256k1');
// alice.generateKeys();
// const alicePrivateKey = alice.getPrivateKey('base64');
// const alicePublicKey = alice.getPublicKey('base64');

// const bob = crypto.createECDH('secp256k1');
// bob.generateKeys();
// const bobPrivateKey = bob.getPrivateKey('base64');
// const bobPublicKey = bob.getPublicKey('base64');

// const sharedText = "some_shared_secret";
// const derivedKey1 = deriveSharedKey(alicePrivateKey, bobPublicKey, sharedText);
// const derivedKey2 = deriveSharedKey(bobPrivateKey, alicePublicKey, sharedText);

// console.assert(derivedKey1.equals(derivedKey2), "The derived keys do not match!");

// const textToEncrypt = "This is a secret meszsage.";
// const encryptedData = encryptText(derivedKey1, textToEncrypt);
// console.log("Encrypted Data:", encryptedData);

// const decryptedText = decryptText(derivedKey2, encryptedData.iv, encryptedData.encrypted, encryptedData.authTag);
// console.log("Decrypted Text:", decryptedText);

// console.assert(textToEncrypt === decryptedText, "The decrypted text does not match the original text!");