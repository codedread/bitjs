export namespace UnarchiveEventType {
    const START: string;
    const APPEND: string;
    const PROGRESS: string;
    const EXTRACT: string;
    const FINISH: string;
    const INFO: string;
    const ERROR: string;
}
/** An unarchive event. */
export class UnarchiveEvent extends Event {
    /**
     * @param {string} type The event type.
     */
    constructor(type: string);
}
/** Updates all Unarchiver listeners that an append has occurred. */
export class UnarchiveAppendEvent extends UnarchiveEvent {
    /**
     * @param {number} numBytes The number of bytes appended.
     */
    constructor(numBytes: number);
    /**
     * The number of appended bytes.
     * @type {number}
     */
    numBytes: number;
}
/** Useful for passing info up to the client (for debugging). */
export class UnarchiveInfoEvent extends UnarchiveEvent {
    /**
     * The information message.
     * @type {string}
     */
    msg: string;
}
/** An unrecoverable error has occured. */
export class UnarchiveErrorEvent extends UnarchiveEvent {
    /**
     * The information message.
     * @type {string}
     */
    msg: string;
}
/** Start event. */
export class UnarchiveStartEvent extends UnarchiveEvent {
    constructor();
}
/** Finish event. */
export class UnarchiveFinishEvent extends UnarchiveEvent {
    /**
     * @param {Object} metadata A collection of metadata about the archive file.
     */
    constructor(metadata?: any);
    metadata: any;
}
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
    constructor(currentFilename: string, currentFileNumber: number, currentBytesUnarchivedInFile: number, currentBytesUnarchived: number, totalUncompressedBytesInArchive: number, totalFilesInArchive: number, totalCompressedBytesRead: number);
    currentFilename: string;
    currentFileNumber: number;
    currentBytesUnarchivedInFile: number;
    totalFilesInArchive: number;
    currentBytesUnarchived: number;
    totalUncompressedBytesInArchive: number;
    totalCompressedBytesRead: number;
}
/** Extract event. */
export class UnarchiveExtractEvent extends UnarchiveEvent {
    /**
     * @param {UnarchivedFile} unarchivedFile
     */
    constructor(unarchivedFile: UnarchivedFile);
    /**
     * @type {UnarchivedFile}
     */
    unarchivedFile: UnarchivedFile;
}
//# sourceMappingURL=events.d.ts.map