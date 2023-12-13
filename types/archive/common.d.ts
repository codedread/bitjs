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
 * Connects a host to a compress/decompress implementation via MessagePorts. The implementation must
 * have an exported connect() function that accepts a MessagePort. If the runtime support Workers
 * (e.g. web browsers, deno), imports the implementation inside a Web Worker. Otherwise, it
 * dynamically imports the implementation inside the current JS context (node, bun).
 * @param {string} implFilename The compressor/decompressor implementation filename relative to this
 *     path (e.g. './unzip.js').
 * @returns {Promise<MessagePort>} The Promise resolves to the MessagePort connected to the
 *     implementation that the host should use.
 */
export function getConnectedPort(implFilename: string): Promise<MessagePort>;
//# sourceMappingURL=common.d.ts.map