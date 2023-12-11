/**
 * Factory method that creates an unarchiver based on the byte signature found
 * in the arrayBuffer.
 * @param {ArrayBuffer} ab
 * @param {Function(string):Promise<*>} connectPortFn A function that connects the impl port.
 * @param {Object|string} options An optional object of options, or a string representing where
 *     the path to the unarchiver script files.
 * @returns {Unarchiver}
 */
export function getUnarchiverInternal(ab: ArrayBuffer, connectPortFn: any, options?: any | string): Unarchiver;
export namespace ThreadingMode {
    const WEB_WORKER: string;
}
/**
 * @typedef UnarchiverOptions
 * @property {string} pathToBitJS The path to the bitjs folder.
 * @property {boolean=} debug Set to true for verbose unarchiver logging.
 * @property {ThreadingMode=} threadingMode The default is WEB_WORKER.
 */
/**
 * Base class for all Unarchivers.
 */
export class Unarchiver extends EventTarget {
    /**
     * @param {ArrayBuffer} arrayBuffer The Array Buffer. Note that this ArrayBuffer must not be
     *     referenced once it is sent to the Unarchiver, since it is marked as Transferable and sent
     *     to the decompress implementation.
     * @param {Function(string, MessagePort):Promise<*>} connectPortFn A function that takes a path
     *     to a JS decompression implementation (unzip.js) and connects it to a MessagePort.
     * @param {UnarchiverOptions|string} options An optional object of options, or a string
     *     representing where the BitJS files are located.  The string version of this argument is
     *     deprecated.
     */
    constructor(arrayBuffer: ArrayBuffer, connectPortFn: any, options?: UnarchiverOptions | string);
    /**
     * The client-side port that sends messages to, and receives messages from the
     * decompressor implementation.
     * @type {MessagePort}
     * @private
     */
    private port_;
    /**
     * The ArrayBuffer object.
     * @type {ArrayBuffer}
     * @protected
     */
    protected ab: ArrayBuffer;
    /**
     * A factory method that connects a port to the decompress implementation.
     * @type {Function(MessagePort): Promise<*>}
     * @private
     */
    private connectPortFn_;
    /**
     * The path to the BitJS files.
     * @type {string}
     * @private
     */
    private pathToBitJS_;
    /**
     * @orivate
     * @type {boolean}
     */
    debugMode_: boolean;
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
     *
     * @param {Object} obj
     * @private
     */
    private handlePortEvent_;
    /**
     * Starts the unarchive by connecting the ports and sending the first ArrayBuffer.
     */
    start(): void;
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
export class UnzipperInternal extends Unarchiver {
    constructor(arrayBuffer: any, connectPortFn: any, options: any);
}
export class UnrarrerInternal extends Unarchiver {
    constructor(arrayBuffer: any, connectPortFn: any, options: any);
}
export class UntarrerInternal extends Unarchiver {
    constructor(arrayBuffer: any, connectPortFn: any, options: any);
}
export type UnarchivedFile = {
    filename: string;
    fileData: Uint8Array;
};
export type UnarchiverOptions = {
    /**
     * The path to the bitjs folder.
     */
    pathToBitJS: string;
    /**
     * Set to true for verbose unarchiver logging.
     */
    debug?: boolean | undefined;
    /**
     * The default is WEB_WORKER.
     */
    threadingMode?: {
        WEB_WORKER: string;
    } | undefined;
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
//# sourceMappingURL=decompress-internal.d.ts.map