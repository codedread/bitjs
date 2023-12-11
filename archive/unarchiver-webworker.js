/**
 * unarchiver-webworker.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */

/**
 * A WebWorker wrapper for a decompress implementation. Upon creation and being
 * sent its first message, it dynamically loads the correct decompressor and
 * connects the message port
 */

/** @type {MessagePort} */
let implPort;

onmessage = async (evt) => {
  const module = await import(evt.data.implSrc);
  module.connect(evt.ports[0]);
};
