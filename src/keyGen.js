import crypto from 'crypto';

const ecdh = crypto.createECDH('secp256k1');
ecdh.generateKeys();

export function createPublicKey() {
    return ecdh.getPublicKey('hex');
}

export function createPrivateKey() {
    return ecdh.getPrivateKey('hex');
}