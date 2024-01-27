/**
 * events.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2023 Google Inc.
 */

// TODO(2.0): Consider deprecating the Event subclasses here and:
//     1) Make @typedef structures in jsdoc for all the payloads
//     2) Use CustomEvent for payload event propagation
//     3) Add semantic methods to the archivers (onExtract, onProgress) like the image parsers.
//     4) Move everything into common.js ?

/**
 * The UnarchiveEvent types.
 */
export const UnarchiveEventType = {
  START: 'start',
  APPEND: 'append',
  PROGRESS: 'progress',
  EXTRACT: 'extract',
  FINISH: 'finish',
  INFO: 'info',
  ERROR: 'error'
};

// TODO: Use CustomEvent and a @template and remove these boilerplate events.

/** An unarchive event. */
export class UnarchiveEvent extends Event {
  /**
   * @param {string} type The event type.
   */
  constructor(type) {
    super(type);
  }
}

/** Updates all Unarchiver listeners that an append has occurred. */
export class UnarchiveAppendEvent extends UnarchiveEvent {
  /**
   * @param {number} numBytes The number of bytes appended.
   */
  constructor(numBytes) {
    super(UnarchiveEventType.APPEND);

    /**
     * The number of appended bytes.
     * @type {number}
     */
    this.numBytes = numBytes;
  }
}

/** Useful for passing info up to the client (for debugging). */
export class UnarchiveInfoEvent extends UnarchiveEvent {
  /**
   * @param {string} msg The info message.
   */
  constructor(msg) {
    super(UnarchiveEventType.INFO);

    /**
     * The information message.
     * @type {string}
     */
    this.msg = msg;
  }
}

/** An unrecoverable error has occured. */
export class UnarchiveErrorEvent extends UnarchiveEvent {
  /**
   * @param {string} msg The error message.
   */
  constructor(msg) {
    super(UnarchiveEventType.ERROR);

    /**
     * The information message.
     * @type {string}
     */
    this.msg = msg;
  }
}

/** Start event. */
export class UnarchiveStartEvent extends UnarchiveEvent {
  constructor() {
    super(UnarchiveEventType.START);
  }
}

/** Finish event. */
export class UnarchiveFinishEvent extends UnarchiveEvent {
  /**
   * @param {Object} metadata A collection of metadata about the archive file.
   */
  constructor(metadata = {}) {
    super(UnarchiveEventType.FINISH);
    this.metadata = metadata;
  }
}

// TODO(bitjs): Fully document these. They are confusing.
/** Progress event. */
export class UnarchiveProgressEvent extends UnarchiveEvent {
  /**
   * @param {string} currentFilename
   * @param {number} currentFileNumber
   * @param {number} currentBytesUnarchivedInFile
   * @param {number} currentBytesUnarchived
   * @param {number} totalUncompressedBytesInArchive
   * @param {number} totalFilesInArchive
   * @param {number} totalCompressedBytesRead
   */
  constructor(currentFilename, currentFileNumber, currentBytesUnarchivedInFile,
    currentBytesUnarchived, totalUncompressedBytesInArchive, totalFilesInArchive,
    totalCompressedBytesRead) {
    super(UnarchiveEventType.PROGRESS);

    this.currentFilename = currentFilename;
    this.currentFileNumber = currentFileNumber;
    this.currentBytesUnarchivedInFile = currentBytesUnarchivedInFile;
    this.totalFilesInArchive = totalFilesInArchive;
    this.currentBytesUnarchived = currentBytesUnarchived;
    this.totalUncompressedBytesInArchive = totalUncompressedBytesInArchive;
    this.totalCompressedBytesRead = totalCompressedBytesRead;
  }
}

/** Extract event. */
export class UnarchiveExtractEvent extends UnarchiveEvent {
  /**
   * @param {UnarchivedFile} unarchivedFile
   */
  constructor(unarchivedFile) {
    super(UnarchiveEventType.EXTRACT);

    /**
     * @type {UnarchivedFile}
     */
    this.unarchivedFile = unarchivedFile;
  }
}
