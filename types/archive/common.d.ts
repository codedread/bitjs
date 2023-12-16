/**
 * common.js
 *
 * Provides common functionality for compressing and decompressing.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
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