// https://mothereff.in/binary-ascii
// https://easytoolz.us/word-counter?gad_source=1&gclid=CjwKCAjwl4yyBhAgEiwADSEjeOtqIMDyXKcFfuPp7T7HBrP_njIk38z-sXxDGEKHWtZJIKU4AMLTRBoCv4YQAvD_BwE

exports.createPublicKey = function() {
    var crypto = require('crypto');
    var prime_length = 1536; // 2048 bits
    var diffHell = crypto.createDiffieHellman(prime_length);
    diffHell.generateKeys('base64');
    var publicKey = diffHell.getPublicKey('base64');
    return publicKey;
}

exports.createPrivateKey = function() {
    var crypto = require('crypto');
    var prime_length = 1536; // 2048 bits
    var diffHell = crypto.createDiffieHellman(prime_length);
    diffHell.generateKeys('base64');
    var privateKey = diffHell.getPrivateKey('base64');
    return privateKey;
}