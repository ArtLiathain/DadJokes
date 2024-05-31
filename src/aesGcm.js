import {createPublicKey, createPrivateKey} from './keyGen.js';

var sharedText = "hureiafg4378r9416378";

function encryptAesGcm(publicKey, privateKey, sharedText) {
    var key = publicKey + privateKey + sharedText;
    return key;
}

console.log(encryptAesGcm(createPublicKey(), createPrivateKey(), sharedText));
