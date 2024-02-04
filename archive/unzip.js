/**
 * unzip.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 *
 * Reference Documentation:
 *
 * ZIP format: http://www.pkware.com/documents/casestudies/APPNOTE.TXT
 * DEFLATE format: http://tools.ietf.org/html/rfc1951
 */

import { ByteStream } from '../io/bytestream.js';
import { ARCHIVE_EXTRA_DATA_SIG, CENTRAL_FILE_HEADER_SIG, CRC32_MAGIC_NUMBER,
  DATA_DESCRIPTOR_SIG, DIGITAL_SIGNATURE_SIG, END_OF_CENTRAL_DIR_SIG,
  LOCAL_FILE_HEADER_SIG } from './common.js';
import { inflate } from './inflate.js';

const UnarchiveState = {
  NOT_STARTED: 0,
  UNARCHIVING: 1,
  WAITING: 2,
  FINISHED: 3,
};

/** @type {MessagePort} */
let hostPort;

// State - consider putting these into a class.
let unarchiveState = UnarchiveState.NOT_STARTED;
/** @type {ByteStream} */
let bytestream = null;
let allLocalFiles = null;
let logToConsole = false;

// Progress variables.
let currentFilename = '';
let currentFileNumber = 0;
let currentBytesUnarchivedInFile = 0;
let currentBytesUnarchived = 0;
let totalUncompressedBytesInArchive = 0;
let totalFilesInArchive = 0;

// Helper functions.
const info = function (str) {
  hostPort.postMessage({ type: 'info', msg: str });
};
const err = function (str) {
  hostPort.postMessage({ type: 'error', msg: str });
};
const postProgress = function () {
  hostPort.postMessage({
    type: 'progress',
    currentFilename,
    currentFileNumber,
    currentBytesUnarchivedInFile,
    currentBytesUnarchived,
    totalUncompressedBytesInArchive,
    totalFilesInArchive,
    totalCompressedBytesRead: bytestream.getNumBytesRead(),
  });
};

// mask for getting the Nth bit (zero-based)
const BIT = [0x01, 0x02, 0x04, 0x08,
  0x10, 0x20, 0x40, 0x80,
  0x100, 0x200, 0x400, 0x800,
  0x1000, 0x2000, 0x4000, 0x8000];

class ZipLocalFile {
  /** @param {ByteStream} bstream */
  constructor(bstream) {
    if (typeof bstream != typeof {} || !bstream.readNumber || typeof bstream.readNumber != typeof function () { }) {
      return null;
    }

    bstream.readNumber(4); // swallow signature
    this.version = bstream.readNumber(2);
    this.generalPurpose = bstream.readNumber(2);
    this.compressionMethod = bstream.readNumber(2);
    this.lastModFileTime = bstream.readNumber(2);
    this.lastModFileDate = bstream.readNumber(2);
    this.crc32 = bstream.readNumber(4);
    this.compressedSize = bstream.readNumber(4);
    this.uncompressedSize = bstream.readNumber(4);
    this.fileNameLength = bstream.readNumber(2);
    this.extraFieldLength = bstream.readNumber(2);

    this.filename = null;
    if (this.fileNameLength > 0) {
      this.filename = bstream.readString(this.fileNameLength);
    }

    this.extraField = null;
    if (this.extraFieldLength > 0) {
      this.extraField = bstream.readString(this.extraFieldLength);
    }

    // Data descriptor is present if this bit is set, compressed size should be zero.
    this.hasDataDescriptor = ((this.generalPurpose & BIT[3]) !== 0);
    if (this.hasDataDescriptor &&
      (this.crc32 !== 0 || this.compressedSize !== 0 || this.uncompressedSize !== 0)) {
      err('Zip local file with a data descriptor and non-zero crc/compressedSize/uncompressedSize');
    }

    // Read in the compressed data if we have no data descriptor.
    /** @type {Uint8Array} */
    this.fileData = null;
    let descriptorSize = 0;
    if (this.hasDataDescriptor) {
      // Hold on to a reference to the bstream, since that is where the compressed file data begins.
      let savedBstream = bstream.tee();

      // Seek ahead one byte at a time, looking for the next local file header signature or the end
      // of all local files.
      let foundDataDescriptor = false;
      let numBytesSeeked = 0;
      while (!foundDataDescriptor) {
        while (bstream.peekNumber(4) !== LOCAL_FILE_HEADER_SIG &&
          bstream.peekNumber(4) !== ARCHIVE_EXTRA_DATA_SIG &&
          bstream.peekNumber(4) !== CENTRAL_FILE_HEADER_SIG) {
          numBytesSeeked++;
          bstream.readBytes(1);
        }

        // Copy all the read bytes into a buffer and examine the last 16 bytes to see if they are the
        // data descriptor.
        let bufferedByteArr = savedBstream.peekBytes(numBytesSeeked);
        const descriptorStream = new ByteStream(bufferedByteArr.buffer, numBytesSeeked - 16, 16);
        const maybeDescriptorSig = descriptorStream.readNumber(4);
        const maybeCrc32 = descriptorStream.readNumber(4);
        const maybeCompressedSize = descriptorStream.readNumber(4);
        const maybeUncompressedSize = descriptorStream.readNumber(4);

        // From the PKZIP App Note: "The signature value 0x08074b50 is also used by some ZIP
        // implementations as a marker for the Data Descriptor record".
        if (maybeDescriptorSig === DATA_DESCRIPTOR_SIG) {
          if (maybeCompressedSize === (numBytesSeeked - 16)) {
            foundDataDescriptor = true;
            descriptorSize = 16;
          }
        } else if (maybeCompressedSize === (numBytesSeeked - 12)) {
          foundDataDescriptor = true;
          descriptorSize = 12;
        }

        if (foundDataDescriptor) {
          this.crc32 = maybeCrc32;
          this.compressedSize = maybeCompressedSize;
          this.uncompressedSize = maybeUncompressedSize;
        }
      }
      bstream = savedBstream;
    }

    this.fileData = new Uint8Array(bstream.readBytes(this.compressedSize));
    bstream.readBytes(descriptorSize);

    // Now that we have all the bytes for this file, we can print out some information.
    if (logToConsole) {
      info('Zip Local File Header:');
      info(` version=${this.version}`);
      info(` general purpose=${this.generalPurpose}`);
      info(` compression method=${this.compressionMethod}`);
      info(` last mod file time=${this.lastModFileTime}`);
      info(` last mod file date=${this.lastModFileDate}`);
      info(` crc32=${this.crc32}`);
      info(` compressed size=${this.compressedSize}`);
      info(` uncompressed size=${this.uncompressedSize}`);
      info(` file name length=${this.fileNameLength}`);
      info(` extra field length=${this.extraFieldLength}`);
      info(` filename = '${this.filename}'`);
      info(` hasDataDescriptor = ${this.hasDataDescriptor}`);
    }
  }

  // determine what kind of compressed data we have and decompress
  async unzip() {
    if (!this.fileData) {
      err('unzip() called on a file with out compressed file data');
    }

    // Zip Version 1.0, no compression (store only)
    if (this.compressionMethod == 0) {
      if (logToConsole) {
        info(`ZIP v${this.version}, store only: ${this.filename} (${this.compressedSize} bytes)`);
      }
      currentBytesUnarchivedInFile = this.compressedSize;
      currentBytesUnarchived += this.compressedSize;
    }
    // version == 20, compression method == 8 (DEFLATE)
    else if (this.compressionMethod == 8) {
      if (logToConsole) {
        info(`ZIP v2.0, DEFLATE: ${this.filename} (${this.compressedSize} bytes)`);
      }
      this.fileData = await inflate(this.fileData, this.uncompressedSize);
    }
    else {
      err(`UNSUPPORTED VERSION/FORMAT: ZIP v${this.version}, ` +
        `compression method=${this.compressionMethod}: ` +
        `${this.filename} (${this.compressedSize} bytes)`);
      this.fileData = null;
    }
  }
}

async function archiveUnzip() {
  let bstream = bytestream.tee();

  // loop until we don't see any more local files or we find a data descriptor.
  while (bstream.peekNumber(4) == LOCAL_FILE_HEADER_SIG) {
    // Note that this could throw an error if the bstream overflows, which is caught in the
    // message handler.
    const oneLocalFile = new ZipLocalFile(bstream);
    // this should strip out directories/folders
    if (oneLocalFile && oneLocalFile.uncompressedSize > 0 && oneLocalFile.fileData) {
      // If we make it to this point and haven't thrown an error, we have successfully
      // read in the data for a local file, so we can update the actual bytestream.
      bytestream = bstream.tee();

      allLocalFiles.push(oneLocalFile);
      totalUncompressedBytesInArchive += oneLocalFile.uncompressedSize;

      // update progress
      currentFilename = oneLocalFile.filename;
      currentFileNumber = allLocalFiles.length - 1;
      currentBytesUnarchivedInFile = 0;

      // Actually do the unzipping.
      await oneLocalFile.unzip();

      if (oneLocalFile.fileData != null) {
        hostPort.postMessage({ type: 'extract', unarchivedFile: oneLocalFile }, [oneLocalFile.fileData.buffer]);
        postProgress();
      }
    }
  }
  totalFilesInArchive = allLocalFiles.length;

  // archive extra data record
  if (bstream.peekNumber(4) == ARCHIVE_EXTRA_DATA_SIG) {
    if (logToConsole) {
      info(' Found an Archive Extra Data Signature');
    }

    // skipping this record for now
    bstream.readNumber(4);
    const archiveExtraFieldLength = bstream.readNumber(4);
    bstream.readString(archiveExtraFieldLength);
  }

  // central directory structure
  // TODO: handle the rest of the structures (Zip64 stuff)
  if (bstream.peekNumber(4) == CENTRAL_FILE_HEADER_SIG) {
    if (logToConsole) {
      info(' Found a Central File Header');
    }

    // read all file headers
    while (bstream.peekNumber(4) == CENTRAL_FILE_HEADER_SIG) {
      bstream.readNumber(4); // signature
      const cdfh = {
        versionMadeBy: bstream.readNumber(2),
        versionNeededToExtract: bstream.readNumber(2),
        generalPurposeBitFlag: bstream.readNumber(2),
        compressionMethod: bstream.readNumber(2),
        lastModFileTime: bstream.readNumber(2),
        lastModFileDate: bstream.readNumber(2),
        crc32: bstream.readNumber(4),
        compressedSize: bstream.readNumber(4),
        uncompressedSize: bstream.readNumber(4),
        fileNameLength: bstream.readNumber(2),
        extraFieldLength: bstream.readNumber(2),
        fileCommentLength: bstream.readNumber(2),
        diskNumberStart: bstream.readNumber(2),
        internalFileAttributes: bstream.readNumber(2),
        externalFileAttributes: bstream.readNumber(4),
        relativeOffset: bstream.readNumber(4),
      };
      cdfh.fileName = bstream.readString(cdfh.fileNameLength);
      cdfh.extraField = bstream.readString(cdfh.extraFieldLength);
      cdfh.fileComment = bstream.readString(cdfh.fileCommentLength);
      if (logToConsole) {
        console.log('Central Directory File Header:');
        for (const field in cdfh) {
          console.log(`  ${field} = ${cdfh[field]}`);
        }
      }
    }
  }

  // digital signature
  if (bstream.peekNumber(4) == DIGITAL_SIGNATURE_SIG) {
    if (logToConsole) {
      info(' Found a Digital Signature');
    }

    bstream.readNumber(4);
    const sizeOfSignature = bstream.readNumber(2);
    bstream.readString(sizeOfSignature); // digital signature data
  }

  let metadata = {};
  if (bstream.peekNumber(4) == END_OF_CENTRAL_DIR_SIG) {
    bstream.readNumber(4); // signature
    const eocds = {
      numberOfThisDisk: bstream.readNumber(2),
      diskWhereCentralDirectoryStarts: bstream.readNumber(2),
      numberOfCentralDirectoryRecordsOnThisDisk: bstream.readNumber(2),
      totalNumberOfCentralDirectoryRecords: bstream.readNumber(2),
      sizeOfCentralDirectory: bstream.readNumber(4),
      offsetOfStartOfCentralDirectory: bstream.readNumber(4),
      commentLength: bstream.readNumber(2),
    };
    eocds.comment = bstream.readString(eocds.commentLength);
    if (logToConsole) {
      console.log('End of Central Dir Signature:');
      for (const field in eocds) {
        console.log(`  ${field} = ${eocds[field]}`);
      }
    }
    metadata.comment = eocds.comment;
  }

  postProgress();

  bytestream = bstream.tee();

  unarchiveState = UnarchiveState.FINISHED;
  hostPort.postMessage({ type: 'finish', metadata });
}

// event.data.file has the first ArrayBuffer.
// event.data.bytes has all subsequent ArrayBuffers.
const onmessage = async function (event) {
  const bytes = event.data.file || event.data.bytes;
  logToConsole = !!event.data.logToConsole;

  // This is the very first time we have been called. Initialize the bytestream.
  if (!bytestream) {
    bytestream = new ByteStream(bytes);
  } else {
    bytestream.push(bytes);
  }

  if (unarchiveState === UnarchiveState.NOT_STARTED) {
    currentFilename = '';
    currentFileNumber = 0;
    currentBytesUnarchivedInFile = 0;
    currentBytesUnarchived = 0;
    totalUncompressedBytesInArchive = 0;
    totalFilesInArchive = 0;
    currentBytesUnarchived = 0;
    allLocalFiles = [];

    hostPort.postMessage({ type: 'start' });

    unarchiveState = UnarchiveState.UNARCHIVING;

    postProgress();
  }

  if (unarchiveState === UnarchiveState.UNARCHIVING ||
      unarchiveState === UnarchiveState.WAITING) {
    try {
      await archiveUnzip();
    } catch (e) {
      if (typeof e === 'string' && e.startsWith('Error!  Overflowed')) {
        // Overrun the buffer.
        unarchiveState = UnarchiveState.WAITING;
      } else {
        console.error('Found an error while unzipping');
        console.dir(e);
        throw e;
      }
    }
  }
};

/**
 * Connect the host to the unzip implementation with the given MessagePort.
 * @param {MessagePort} port
 */
export function connect(port) {
  if (hostPort) {
    throw `hostPort already connected in unzip.js`;
  }

  hostPort = port;
  port.onmessage = onmessage;
}

export function disconnect() {
  if (!hostPort) {
    throw `hostPort was not connected in unzip.js`;
  }

  hostPort = null;

  unarchiveState = UnarchiveState.NOT_STARTED;
  bytestream = null;
  allLocalFiles = null;
  logToConsole = false;
  
  // Progress variables.
  currentFilename = '';
  currentFileNumber = 0;
  currentBytesUnarchivedInFile = 0;
  currentBytesUnarchived = 0;
  totalUncompressedBytesInArchive = 0;
  totalFilesInArchive = 0;  
}
