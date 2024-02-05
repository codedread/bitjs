/**
 * Factory method that creates an unarchiver based on the byte signature found
 * in the ArrayBuffer.
 * @param {ArrayBuffer} ab The ArrayBuffer to unarchive. Note that this ArrayBuffer
 *     must not be referenced after calling this method, as the ArrayBuffer may be
 *     transferred to a different JS context once start() is called.
 * @param {UnarchiverOptions|string} options An optional object of options, or a
 *     string representing where the path to the unarchiver script files. The latter
 *     is now deprecated (use UnarchiverOptions).
 * @returns {Unarchiver}
 */
export function getUnarchiver(ab: ArrayBuffer, options?: UnarchiverOptions | string): Unarchiver;
/**
 * All extracted files returned by an Unarchiver will implement
 * the following interface:
 * TODO: Move this interface into common.js?
 */
/**
 * @typedef UnarchivedFile
 * @property {string} filename
 * @property {Uint8Array} fileData
 */
/**
 * @typedef UnarchiverOptions
 * @property {boolean=} debug Set to true for verbose unarchiver logging.
 */
/**
 * Base class for all Unarchivers.
 */
export class Unarchiver extends EventTarget {
    /**
     * @param {ArrayBuffer} arrayBuffer The Array Buffer. Note that this ArrayBuffer must not be
     *     referenced once it is sent to the Unarchiver, since it is marked as Transferable and sent
     *     to the decompress implementation.
     * @param {UnarchiverOptions|string} options An optional object of options, or a string
     *     representing where the BitJS files are located.  The string version of this argument is
     *     deprecated.
     */
    constructor(arrayBuffer: ArrayBuffer, options?: UnarchiverOptions | string);
    /**
     * The client-side port that sends messages to, and receives messages from, the
     * decompressor implementation.
     * @type {MessagePort}
     * @private
     */
    private port_;
    /**
     * A function to call to disconnect the implementation from the host.
     * @type {Function}
     * @private
     */
    private disconnectFn_;
    /**
     * The ArrayBuffer object.
     * @type {ArrayBuffer}
     * @protected
     */
    protected ab: ArrayBuffer;
    /**
     * @orivate
     * @type {boolean}
     */
    debugMode_: boolean;
    /**
     * Overridden so that the type hints for eventType are specific. Prefer onExtract(), etc.
     * @param {'progress'|'extract'|'finish'} eventType
     * @param {EventListenerOrEventListenerObject} listener
     * @override
     */
    override addEventListener(eventType: 'progress' | 'extract' | 'finish', listener: EventListenerOrEventListenerObject): void;
    /**
     * Type-safe way to subscribe to an UnarchiveExtractEvent.
     * @param {function(UnarchiveExtractEvent)} listener
     * @returns {Unarchiver} for chaining.
     */
    onExtract(listener: (arg0: UnarchiveExtractEvent) => any): Unarchiver;
    /**
     * Type-safe way to subscribe to an UnarchiveFinishEvent.
     * @param {function(UnarchiveFinishEvent)} listener
     * @returns {Unarchiver} for chaining.
     */
    onFinish(listener: (arg0: UnarchiveFinishEvent) => any): Unarchiver;
    /**
     * Type-safe way to subscribe to an UnarchiveProgressEvent.
     * @param {function(UnarchiveProgressEvent)} listener
     * @returns {Unarchiver} for chaining.
     */
    onProgress(listener: (arg0: UnarchiveProgressEvent) => any): Unarchiver;
    /**
     * This method must be overridden by the subclass to return the script filename.
     * @returns {string} The MIME type of the archive.
     * @protected.
     */
    protected getMIMEType(): string;
    /**
     * This method must be overridden by the subclass to return the script filename.
     * @returns {string} The script filename.
     * @protected.
     */
    protected getScriptFileName(): string;
    /**
     * Create an UnarchiveEvent out of the object sent back from the implementation.
     * @param {Object} obj
     * @returns {UnarchiveEvent}
     * @private
     */
    private createUnarchiveEvent_;
    /**
     * Receive an event and pass it to the listener functions.
     * @param {Object} obj
     * @returns {boolean} Returns true if the decompression is finished.
     * @private
     */
    private handlePortEvent_;
    /**
     * Starts the unarchive by connecting the ports and sending the first ArrayBuffer.
     * @returns {Promise<void>} A Promise that resolves when the decompression is complete. While the
     *     decompression is proceeding, you can send more bytes of the archive to the decompressor
     *     using the update() method.
     */
    start(): Promise<void>;
    /**
     * Adds more bytes to the unarchiver.
     * @param {ArrayBuffer} ab The ArrayBuffer with more bytes in it. If opt_transferable is
     *     set to true, this ArrayBuffer must not be referenced after calling update(), since it
     *     is marked as Transferable and sent to the implementation.
     * @param {boolean=} opt_transferable Optional boolean whether to mark this ArrayBuffer
     *     as a Tranferable object, which means it can no longer be referenced outside of
     *     the implementation context.
     */
    update(ab: ArrayBuffer, opt_transferable?: boolean | undefined): void;
    /**
     * Closes the port to the decompressor implementation and terminates it.
     */
    stop(): void;
}
export class Unzipper extends Unarchiver {
    /**
     * @param {ArrayBuffer} ab
     * @param {UnarchiverOptions} options
     */
    constructor(ab: ArrayBuffer, options?: UnarchiverOptions);
}
export class Unrarrer extends Unarchiver {
    /**
     * @param {ArrayBuffer} ab
     * @param {UnarchiverOptions} options
     */
    constructor(ab: ArrayBuffer, options?: UnarchiverOptions);
}
export class Untarrer extends Unarchiver {
    /**
     * @param {ArrayBuffer} ab
     * @param {UnarchiverOptions} options
     */
    constructor(ab: ArrayBuffer, options?: UnarchiverOptions);
}
/**
 * IMPORTANT NOTES for Gunzipper:
 * 1) A Gunzipper will only ever emit one EXTRACT event, because a gzipped file only ever contains
 *    a single file.
 * 2) If the gzipped file does not include the original filename as a FNAME block, then the
 *    UnarchivedFile in the UnarchiveExtractEvent will not include a filename. It will be up to the
 *    client to re-assemble the filename (if needed).
 * 3) update() is not supported on a Gunzipper, since the current implementation relies on runtime
 *    support for DecompressionStream('gzip') which can throw hard-to-detect errors reading only
 *    only part of a file.
 * 4) PROGRESS events are not yet supported in Gunzipper.
 */
export class Gunzipper extends Unarchiver {
    /**
     * @param {ArrayBuffer} ab
     * @param {UnarchiverOptions} options
     */
    constructor(ab: ArrayBuffer, options?: UnarchiverOptions);
}
export type UnarchivedFile = {
    filename: string;
    fileData: Uint8Array;
};
export type UnarchiverOptions = {
    /**
     * Set to true for verbose unarchiver logging.
     */
    debug?: boolean | undefined;
};
import { UnarchiveAppendEvent } from "./events.js";
import { UnarchiveErrorEvent } from "./events.js";
import { UnarchiveEvent } from "./events.js";
import { UnarchiveEventType } from "./events.js";
import { UnarchiveExtractEvent } from "./events.js";
import { UnarchiveFinishEvent } from "./events.js";
import { UnarchiveInfoEvent } from "./events.js";
import { UnarchiveProgressEvent } from "./events.js";
import { UnarchiveStartEvent } from "./events.js";
export { UnarchiveAppendEvent, UnarchiveErrorEvent, UnarchiveEvent, UnarchiveEventType, UnarchiveExtractEvent, UnarchiveFinishEvent, UnarchiveInfoEvent, UnarchiveProgressEvent, UnarchiveStartEvent };
//# sourceMappingURL=decompress.d.ts.map