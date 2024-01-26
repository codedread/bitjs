/**
 * common.js
 *
 * Provides common definitions or functionality needed by multiple modules.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */
/**
 * @typedef FileInfo An object that is sent to the implementation representing a file to compress.
 * @property {string} fileName The name of the file. TODO: Includes the path?
 * @property {number} lastModTime The number of ms since the Unix epoch (1970-01-01 at midnight).
 * @property {Uint8Array} fileData The bytes of the file.
 */
/**
 * @typedef Implementation
 * @property {MessagePort} hostPort The port the host uses to communicate with the implementation.
 * @property {Function} disconnectFn A function to call when the port has been disconnected.
 */
/**
 * Connects a host to a compress/decompress implementation via MessagePorts. The implementation must
 * have an exported connect() function that accepts a MessagePort. If the runtime support Workers
 * (e.g. web browsers, deno), imports the implementation inside a Web Worker. Otherwise, it
 * dynamically imports the implementation inside the current JS context (node, bun).
 * @param {string} implFilename The compressor/decompressor implementation filename relative to this
 *     path (e.g. './unzip.js').
 * @param {Function} disconnectFn A function to run when the port is disconnected.
 * @returns {Promise<Implementation>} The Promise resolves to the Implementation, which includes the
 *     MessagePort connected to the implementation that the host should use.
 */
export function getConnectedPort(implFilename: string): Promise<Implementation>;
export const LOCAL_FILE_HEADER_SIG: 67324752;
export const CENTRAL_FILE_HEADER_SIG: 33639248;
export const END_OF_CENTRAL_DIR_SIG: 101010256;
export const CRC32_MAGIC_NUMBER: 3988292384;
export const ARCHIVE_EXTRA_DATA_SIG: 134630224;
export const DIGITAL_SIGNATURE_SIG: 84233040;
export const END_OF_CENTRAL_DIR_LOCATOR_SIG: 117853008;
export const DATA_DESCRIPTOR_SIG: 134695760;
export type ZipCompressionMethod = number;
export namespace ZipCompressionMethod {
    const STORE: number;
    const DEFLATE: number;
}
/**
 * An object that is sent to the implementation representing a file to compress.
 */
export type FileInfo = {
    /**
     * The name of the file. TODO: Includes the path?
     */
    fileName: string;
    /**
     * The number of ms since the Unix epoch (1970-01-01 at midnight).
     */
    lastModTime: number;
    /**
     * The bytes of the file.
     */
    fileData: Uint8Array;
};
export type Implementation = {
    /**
     * The port the host uses to communicate with the implementation.
     */
    hostPort: MessagePort;
    /**
     * A function to call when the port has been disconnected.
     */
    disconnectFn: Function;
};
//# sourceMappingURL=common.d.ts.map