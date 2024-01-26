/**
 * webworker-wrapper.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */

/**
 * A WebWorker wrapper for a decompress/compress implementation. Upon creation and being sent its
 * first message, it dynamically imports the decompressor / compressor implementation and connects
 * the message port. All other communication takes place over the MessageChannel.
 */

/** @type {MessagePort} */
let implPort;

let module;

onmessage = async (evt) => {
  if (evt.data.implSrc) {
    module = await import(evt.data.implSrc);
    module.connect(evt.ports[0]);
  } else if (evt.data.disconnect) {
    module.disconnect();
  }
};
