import md5 from 'crypto-js/md5';
import UTF8 from 'crypto-js/enc-utf8';
import Base64 from 'crypto-js/enc-base64';

export function encryptByBase64(cipherText: string): string {
  return UTF8.parse(cipherText).toString(Base64);
}

export function decodeByBase64(cipherText: string): string {
  return Base64.parse(cipherText).toString(UTF8);
}

export function encryptByMd5(cipherText: string): string {
  return md5(cipherText).toString();
}
