const CryptoJS = require('crypto-js');
const DOTENV = require('dotenv');

DOTENV.config();

const key = process.env.SECRETKEY;

function Encryption(cardHolderName, cardNumber, cvv) {
    const NewHolder = CryptoJS.AES.encrypt(cardHolderName, key).toString();
    const NewNumber = CryptoJS.AES.encrypt(cardNumber, key).toString();
    const NewCvv = CryptoJS.AES.encrypt(cvv, key).toString();

    return {NewHolder, NewNumber, NewCvv}; 
}
function Decryption(cardHolderName, cardNumber, cvv) {
    const NewHolder = CryptoJS.AES.decrypt(cardHolderName, key);
    const NewNumber = CryptoJS.AES.decrypt(cardNumber, key);
    const NewCvv = CryptoJS.AES.decrypt(cvv, key);

    return ((NewHolder, NewNumber, NewCvv).json());
}

module.exports = { Encryption, Decryption };

