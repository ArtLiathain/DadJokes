async function deriveSharedSecret(privateKey, publicKey) {
  const subtle = window.crypto.subtle;
  const algorithm = { name: 'ECDH', namedCurve: 'P-256' };

  try {
    const importedPublicKey = await subtle.importKey('spki', publicKey, algorithm, false, []);
    const sharedSecret = await subtle.deriveBits(algorithm, privateKey, importedPublicKey.publicKey, 256); // 256 bits
    return new Uint8Array(sharedSecret);
  } catch (error) {
    console.error('Error deriving shared secret:', error);
    throw error; // Re-throw for handling in caller
  }
}

async function encryptText(derivedKey, text) {
  const subtle = window.crypto.subtle;
  const algorithm = { name: 'AES-GCM', ivLength: 12 }; // 12 bytes IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Random IV

  try {
    const importedKey = await subtle.importKey('raw', derivedKey, algorithm, false, ['encrypt']);
    const encodedText = new TextEncoder().encode(text);
    const encrypted = await subtle.encrypt(algorithm, importedKey, encodedText, authTag);

    const authTag = new Uint8Array(encrypted.slice(-16)); // Extract the authentication tag
    const ciphertext = new Uint8Array(encrypted.slice(0, -16)); // Extract the ciphertext

    return {
      iv: Array.from(iv).map(b => String.fromCharCode(b)).join(''), // Convert IV to base64 string
      ciphertext: btoa(String.fromCharCode.apply(null, ciphertext)), // Convert ciphertext to base64 string
      authTag: Array.from(authTag).map(b => String.fromCharCode(b)).join(''), // Convert authTag to base64 string
    };
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw error; // Re-throw for handling in caller
  }
}

async function decryptText(derivedKey, ivBase64, encryptedTextBase64, authTagBase64) {
  const subtle = window.crypto.subtle;
  const algorithm = { name: 'AES-GCM', ivLength: 12 }; // 12 bytes IV
  const iv = Uint8Array.from(atob(ivBase64)).map(c => c.charCodeAt(0)); // Convert IV from base64 string
  const authTag = Uint8Array.from(atob(authTagBase64)).map(c => c.charCodeAt(0)); // Convert authTag from base64 string
  const ciphertext = Uint8Array.from(atob(encryptedTextBase64)).map(c => c.charCodeAt(0)); // Convert ciphertext from base64 string
  try {
    const importedKey = await subtle.importKey('raw', derivedKey, algorithm, false, ['decrypt']);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: iv }, importedKey, ciphertext, authTag);
    const decodedText = new TextDecoder().decode(decrypted);
    return decodedText;
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw error; // Re-throw for handling in caller
  }
}