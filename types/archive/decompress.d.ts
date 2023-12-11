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
export class Unzipper extends UnzipperInternal {
    constructor(ab: any, options: any);
}
export class Unrarrer extends UnrarrerInternal {
    constructor(ab: any, options: any);
}
export class Untarrer extends UntarrerInternal {
    constructor(ab: any, options: any);
}
export type UnarchivedFile = {
    filename: string;
    fileData: Uint8Array;
};
export type UnarchiverOptions = import('./decompress-internal.js').UnarchiverOptions;
import { Unarchiver } from "./decompress-internal.js";
import { UnarchiveAppendEvent } from "./events.js";
import { UnarchiveErrorEvent } from "./events.js";
import { UnarchiveEvent } from "./events.js";
import { UnarchiveEventType } from "./events.js";
import { UnarchiveExtractEvent } from "./events.js";
import { UnarchiveFinishEvent } from "./events.js";
import { UnarchiveInfoEvent } from "./events.js";
import { UnarchiveProgressEvent } from "./events.js";
import { UnarchiveStartEvent } from "./events.js";
import { UnzipperInternal } from "./decompress-internal.js";
import { UnrarrerInternal } from "./decompress-internal.js";
import { UntarrerInternal } from "./decompress-internal.js";
export { UnarchiveAppendEvent, UnarchiveErrorEvent, UnarchiveEvent, UnarchiveEventType, UnarchiveExtractEvent, UnarchiveFinishEvent, UnarchiveInfoEvent, UnarchiveProgressEvent, UnarchiveStartEvent, Unarchiver };
//# sourceMappingURL=decompress.d.ts.map