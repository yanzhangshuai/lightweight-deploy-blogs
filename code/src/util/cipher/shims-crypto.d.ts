declare module 'crypto-js' {
  export type WordArray = CryptoJS.lib.WordArray;
  export type CipherParams = CryptoJS.lib.CipherParams;

  export interface Format {
    /**
     * Converts a cipher params object to an OpenSSL-compatible string.
     *
     * @param cipherParams The cipher params object.
     *
     * @return The OpenSSL-compatible string.
     *
     * @example
     *
     *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
     */
    stringify(cipherParams: CipherParams): string;

    /**
     * Converts an OpenSSL-compatible string to a cipher params object.
     *
     *
     * @return The cipher params object.
     *
     * @example
     *
     *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
     * @param str
     */
    parse(str: string): CipherParams;
  }

  export interface CipherOption {
    /**
     * The IV to use for this operation.
     */
    iv?: WordArray | undefined;
    format?: Format | undefined;
    [key: string]: unknown;
  }
}
