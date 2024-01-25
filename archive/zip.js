/**
 * zip.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2021 Google Inc.
 *
 * Reference Documentation:
 *
 * ZIP format: http://www.pkware.com/documents/casestudies/APPNOTE.TXT
 * DEFLATE format: http://tools.ietf.org/html/rfc1951
 */

import { ByteBuffer } from '../io/bytebuffer.js';
import { CENTRAL_FILE_HEADER_SIG, CRC32_MAGIC_NUMBER, END_OF_CENTRAL_DIR_SIG,
  LOCAL_FILE_HEADER_SIG, ZipCompressionMethod } from './common.js';

/** @typedef {import('./common.js').FileInfo} FileInfo */

/** @type {MessagePort} */
let hostPort;

/**
 * The client sends a set of CompressFilesMessage to the MessagePort containing files to archive in
 * order. The client sets isLastFile to true to indicate to the implementation when the last file
 * has been sent to be compressed.
 *
 * The impl posts an event to the port indicating compression has started: { type: 'start' }.
 * As each file compresses, bytes are sent back in order: { type: 'compress', bytes: Uint8Array }.
 * After the last file compresses, we indicate finish by: { type 'finish' }
 *
 * The client should append the bytes to a single buffer in the order they were received.
 */

// TODO(bitjs): Figure out where this typedef should live.
/**
 * @typedef CompressFilesMessage A message the client sends to the implementation.
 * @property {FileInfo[]} files A set of files to add to the zip file.
 * @property {boolean} isLastFile Indicates this is the last set of files to add to the zip file.
 * @property {ZipCompressionMethod=} compressionMethod The compression method to use. Ignored except
 *     for the first message sent.
 */

// TODO: Support options that can let client choose levels of compression/performance.

/**
 * @typedef CentralDirectoryFileHeaderInfo An object to be used to construct the central directory.
 * @property {string} fileName
 * @property {number} compressionMethod (2 bytes)
 * @property {number} lastModFileTime (2 bytes)
 * @property {number} lastModFileDate (2 bytes)
 * @property {number} crc32 (4 bytes)
 * @property {number} compressedSize (4 bytes)
 * @property {number} uncompressedSize (4 bytes)
 * @property {number} byteOffset (4 bytes)
 */

/** @type {ZipCompressionMethod} */
let compressionMethod = ZipCompressionMethod.STORE;

/** @type {FileInfo[]} */
let filesCompressed = [];

/** @type {CentralDirectoryFileHeaderInfo[]} */
let centralDirectoryInfos = [];

/** @type {number} */
let numBytesWritten = 0;

const CompressorState = {
  NOT_STARTED: 0,
  COMPRESSING: 1,
  WAITING: 2,
  FINISHED: 3,
};
let state = CompressorState.NOT_STARTED;
const crc32Table = createCRC32Table();

/** Helper functions. */

/**
 * Logic taken from https://github.com/nodeca/pako/blob/master/lib/zlib/crc32.js
 * @returns {Uint8Array}
 */
function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (CRC32_MAGIC_NUMBER ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
};

/**
 * Logic taken from https://github.com/nodeca/pako/blob/master/lib/zlib/crc32.js
 * @param {number} crc
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function calculateCRC32(crc, bytes) {
  const len = bytes.byteLength;
  crc ^= -1;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ byte) & 0xFF];
  }
  crc ^= -1;
  if (crc < 0) {
    crc += 0x100000000;
  }
  return crc;
}

/**
 * Logic taken from https://github.com/thejoshwolfe/yazl.
 * @param {number} lastModTime The number of ms since the Unix epoch (1970-01-01 at midnight).
 * @returns {number}
 */
function dateToDosDate(jsDate) {
  let date = 0;
  date |= jsDate.getDate() & 0x1f; // 1-31
  date |= ((jsDate.getMonth() + 1) & 0xf) << 5; // 0-11, 1-12
  date |= ((jsDate.getFullYear() - 1980) & 0x7f) << 9; // 0-128, 1980-2108
  return date;
}

/**
 * Logic taken from https://github.com/thejoshwolfe/yazl.
 * @param {number} lastModTime The number of ms since the Unix epoch (1970-01-01 at midnight).
 * @returns {number}
 */
function dateToDosTime(jsDate) {
  let time = 0;
  time |= Math.floor(jsDate.getSeconds() / 2); // 0-59, 0-29 (lose odd numbers)
  time |= (jsDate.getMinutes() & 0x3f) << 5; // 0-59
  time |= (jsDate.getHours() & 0x1f) << 11; // 0-23
  return time;
}

/**
 * @param {FileInfo} file
 * @returns {Promise<ByteBuffer>}
 */
async function zipOneFile(file) {
  /** @type {Uint8Array} */
  let compressedBytes;
  if (compressionMethod === ZipCompressionMethod.STORE) {
    compressedBytes = file.fileData;
  } else if (compressionMethod === ZipCompressionMethod.DEFLATE) {
    const blob = new Blob([file.fileData.buffer]);
    const compressedStream = blob.stream().pipeThrough(new CompressionStream('deflate-raw'));
    compressedBytes = new Uint8Array(await new Response(compressedStream).arrayBuffer());
  }

  // Zip Local File Header has 30 bytes and then the filename and extrafields.
  const fileHeaderSize = 30 + file.fileName.length;

  /** @type {ByteBuffer} */
  const buffer = new ByteBuffer(fileHeaderSize + compressedBytes.byteLength);

  buffer.writeNumber(LOCAL_FILE_HEADER_SIG, 4); // Magic number.
  buffer.writeNumber(0x0A, 2); // Version.
  buffer.writeNumber(0, 2); // General Purpose Flags.
  buffer.writeNumber(compressionMethod, 2); // Compression Method.

  const jsDate = new Date(file.lastModTime);

  /** @type {CentralDirectoryFileHeaderInfo} */
  const centralDirectoryInfo = {
    compressionMethod,
    lastModFileTime: dateToDosTime(jsDate),
    lastModFileDate: dateToDosDate(jsDate),
    crc32: calculateCRC32(0, file.fileData),
    compressedSize: compressedBytes.byteLength,
    uncompressedSize: file.fileData.byteLength,
    fileName: file.fileName,
    byteOffset: numBytesWritten,
  };
  centralDirectoryInfos.push(centralDirectoryInfo);

  buffer.writeNumber(centralDirectoryInfo.lastModFileTime, 2); // Last Mod File Time.
  buffer.writeNumber(centralDirectoryInfo.lastModFileDate, 2); // Last Mod Date.
  buffer.writeNumber(centralDirectoryInfo.crc32, 4); // crc32.
  buffer.writeNumber(centralDirectoryInfo.compressedSize, 4); // Compressed size.
  buffer.writeNumber(centralDirectoryInfo.uncompressedSize, 4); // Uncompressed size.
  buffer.writeNumber(centralDirectoryInfo.fileName.length, 2); // Filename length.
  buffer.writeNumber(0, 2); // Extra field length.
  buffer.writeASCIIString(centralDirectoryInfo.fileName); // Filename. Assumes ASCII.
  buffer.insertBytes(compressedBytes);

  return buffer;
}

/**
 * @returns {ByteBuffer}
 */
function writeCentralFileDirectory() {
  // Each central directory file header is 46 bytes + the filename.
  let cdsLength = filesCompressed.map(f => f.fileName.length + 46).reduce((a, c) => a + c);
  // 22 extra bytes for the end-of-central-dir header.
  const buffer = new ByteBuffer(cdsLength + 22);

  for (const cdInfo of centralDirectoryInfos) {
    buffer.writeNumber(CENTRAL_FILE_HEADER_SIG, 4); // Magic number.
    buffer.writeNumber(0, 2); // Version made by. // 0x31e
    buffer.writeNumber(0, 2); // Version needed to extract (minimum). // 0x14
    buffer.writeNumber(0, 2); // General purpose bit flag
    buffer.writeNumber(compressionMethod, 2); // Compression method.
    buffer.writeNumber(cdInfo.lastModFileTime, 2); // Last Mod File Time.
    buffer.writeNumber(cdInfo.lastModFileDate, 2); // Last Mod Date.
    buffer.writeNumber(cdInfo.crc32, 4); // crc32.
    buffer.writeNumber(cdInfo.compressedSize, 4); // Compressed size.
    buffer.writeNumber(cdInfo.uncompressedSize, 4); // Uncompressed size.
    buffer.writeNumber(cdInfo.fileName.length, 2); // File name length.
    buffer.writeNumber(0, 2); // Extra field length.
    buffer.writeNumber(0, 2); // Comment length.
    buffer.writeNumber(0, 2); // Disk number where file starts.
    buffer.writeNumber(0, 2); // Internal file attributes.
    buffer.writeNumber(0, 4); // External file attributes.
    buffer.writeNumber(cdInfo.byteOffset, 4); // Relative offset of local file header.
    buffer.writeASCIIString(cdInfo.fileName); // File name.
  }

  // 22 more bytes.
  buffer.writeNumber(END_OF_CENTRAL_DIR_SIG, 4); // Magic number.
  buffer.writeNumber(0, 2); // Number of this disk.
  buffer.writeNumber(0, 2); // Disk where central directory starts.
  buffer.writeNumber(filesCompressed.length, 2); // Number of central directory records on this disk.
  buffer.writeNumber(filesCompressed.length, 2); // Total number of central directory records.
  buffer.writeNumber(cdsLength, 4); // Size of central directory.
  buffer.writeNumber(numBytesWritten, 4); // Offset of start of central directory.
  buffer.writeNumber(0, 2); // Comment length.

  return buffer;
}

/**
 * @param {{data: CompressFilesMessage}} evt The event for the implementation to process. It is an
 *     error to send any more events after a previous event had isLastFile is set to true.
 */
const onmessage = async function(evt) {
  if (state === CompressorState.FINISHED) {
    throw `The zip implementation was sent a message after last file received.`;
  }

  if (state === CompressorState.NOT_STARTED) {
    hostPort.postMessage({ type: 'start' });
  }

  state = CompressorState.COMPRESSING;

  if (filesCompressed.length === 0 && evt.data.compressionMethod !== undefined) {
    if (!Object.values(ZipCompressionMethod).includes(evt.data.compressionMethod)) {
      throw `Do not support compression method ${evt.data.compressionMethod}`;
    }

    compressionMethod = evt.data.compressionMethod;
  }

  const msg = evt.data;
  const filesToCompress = msg.files;
  while (filesToCompress.length > 0) {
    const fileInfo = filesToCompress.shift();
    const fileBuffer = await zipOneFile(fileInfo);
    filesCompressed.push(fileInfo);
    numBytesWritten += fileBuffer.data.byteLength;
    hostPort.postMessage({ type: 'compress', bytes: fileBuffer.data }, [ fileBuffer.data.buffer ]);
  }

  if (evt.data.isLastFile) {
    const centralBuffer = writeCentralFileDirectory();
    numBytesWritten += centralBuffer.data.byteLength;
    hostPort.postMessage({ type: 'compress', bytes: centralBuffer.data },
        [ centralBuffer.data.buffer ]);

    state = CompressorState.FINISHED;
    hostPort.postMessage({ type: 'finish' });
  } else {
    state = CompressorState.WAITING;
  }
};


/**
 * Connect the host to the zip implementation with the given MessagePort.
 * @param {MessagePort} port
 */
export function connect(port) {
  if (hostPort) {
    throw `hostPort already connected in zip.js`;
  }
  hostPort = port;
  port.onmessage = onmessage;
}

export function disconnect() {
  if (!hostPort) {
    throw `hostPort was not connected in zip.js`;
  }

  hostPort = null;

  filesCompressed = [];
  centralDirectoryInfos = [];
  numBytesWritten = 0;
  state = CompressorState.NOT_STARTED;
}
