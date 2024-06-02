import crypto from 'crypto';

export function createPublicKey() {
    var crypto = require('crypto');
    var prime_length = 1536; // 2048 bits
    var diffHell = crypto.createDiffieHellman(prime_length);
    diffHell.generateKeys('base64');
    var publicKey = diffHell.getPublicKey('base64');
    return publicKey;
}

export function createPrivateKey() {
    var crypto = require('crypto');
    var prime_length = 1536; // 2048 bits
    var diffHell = crypto.createDiffieHellman(prime_length);
    diffHell.generateKeys('base64');
    var privateKey = diffHell.getPrivateKey('base64');
    return privateKey;
}
