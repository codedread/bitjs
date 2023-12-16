/**
 * common.js
 *
 * Provides common functionality for compressing and decompressing.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */

// Requires the following JavaScript features: MessageChannel, MessagePort, and dynamic imports.

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
export async function getConnectedPort(implFilename) {
  const messageChannel = new MessageChannel();
  const hostPort = messageChannel.port1;
  const implPort = messageChannel.port2;

  if (typeof Worker === 'undefined') {
    const implModule = await import(`${implFilename}`);
    await implModule.connect(implPort);
    return {
      hostPort,
      disconnectFn: () => implModule.disconnect(),
    };
  }
  
  return new Promise((resolve, reject) => {
    const workerScriptPath = new URL(`./webworker-wrapper.js`, import.meta.url).href;
    const worker = new Worker(workerScriptPath, { type: 'module' });
    worker.postMessage({ implSrc: implFilename }, [implPort]);
    resolve({
      hostPort,
      disconnectFn: () => worker.postMessage({ disconnect: true }),
    });
  });
}
