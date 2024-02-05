/**
 * gunzip.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 *
 * Reference Documentation:
 *
 * https://www.ietf.org/rfc/rfc1952.txt
 */

import { BitStream } from '../io/bitstream.js';
import { ByteStream } from '../io/bytestream.js';

/** @type {MessagePort} */
let hostPort;

/** @type {ByteStream} */
let bstream = null;
// undefined unless a FNAME block is present.
let filename;

const err = str => hostPort.postMessage({ type: 'error', msg: str });

async function gunzip() {
  const sig = bstream.readBytes(2);
  if (sig[0] !== 0x1F || sig[1] !== 0x8B) {
    const errMsg = `First two bytes not 0x1F, 0x8B: ${sig[0].toString(16)} ${sig[1].toString(16)}`;
    err(errMsg);
    return;
  }
  const compressionMethod = bstream.readNumber(1);
  if (compressionMethod !== 8) {
    const errMsg = `Compression method ${compressionMethod} not supported`;
    err(errMsg);
    return;
  }

  // Parse the GZIP header to see if we can find a filename (FNAME block).
  const flags = new BitStream(bstream.readBytes(1).buffer);
  flags.skip(1); // skip FTEXT bit
  const fhcrc = flags.readBits(1);
  const fextra = flags.readBits(1);
  const fname = flags.readBits(1);
  const fcomment = flags.readBits(1);

  bstream.skip(4); // MTIME
  bstream.skip(1); // XFL
  bstream.skip(1); // OS

  if (fextra) {
    const xlen = bstream.readNumber(2);
    bstream.skip(xlen);
  }

  if (fname) {
    // Find the null-terminator byte.
    let numBytes = 0;
    const findNull = bstream.tee();
    while (findNull.readNumber(1) !== 0) numBytes++;
    filename = bstream.readString(numBytes);
  }

  if (fcomment) {
    // Find the null-terminator byte.
    let numBytes = 0;
    const findNull = bstream.tee();
    while (findNull.readNumber(1) !== 0) numBytes++;
    bstream.skip(numBytes); // COMMENT
  }

  if (fhcrc) {
    bstream.readNumber(2); // CRC16
  }

  // Now try to use native implementation of INFLATE, if supported by the runtime.
  const blob = new Blob([bstream.bytes.buffer]);
  const decompressedStream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  const fileData = new Uint8Array(await new Response(decompressedStream).arrayBuffer());
  const unarchivedFile = { filename, fileData };
  hostPort.postMessage({ type: 'extract', unarchivedFile }, [fileData.buffer]);

  // TODO: Supported chunked decompression?
  // TODO: Fall through to non-native implementation via inflate() ?

  hostPort.postMessage({ type: 'finish', metadata: {} });
}

// event.data.file has the first ArrayBuffer.
const onmessage = async function (event) {
  const bytes = event.data.file;

  if (!bstream) {
    bstream = new ByteStream(bytes);
    bstream.setLittleEndian(true);
  } else {
    throw `Gunzipper does not calling update() with more bytes. Send the whole file with start().`
  }

  await gunzip();
};

/**
 * Connect the host to the gunzip implementation with the given MessagePort.
 * @param {MessagePort} port
 */
export function connect(port) {
  if (hostPort) {
    throw `connect(): hostPort already connected in gunzip.js`;
  }

  hostPort = port;
  port.onmessage = onmessage;
}

export function disconnect() {
  if (!hostPort) {
    throw `disconnect(): hostPort was not connected in gunzip.js`;
  }

  hostPort = null;
  bstream = null;
  filename = undefined;
}
