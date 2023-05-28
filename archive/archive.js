/**
 * archive.js
 *
 * Provides base functionality for unarchiving.
 * DEPRECATED: Use decompress.js instead.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 */

import { UnarchiveAppendEvent, UnarchiveErrorEvent, UnarchiveEvent, UnarchiveEventType,
         UnarchiveExtractEvent, UnarchiveFinishEvent, UnarchiveInfoEvent,
         UnarchiveProgressEvent, UnarchiveStartEvent, Unarchiver,
         UnrarrerInternal, UntarrerInternal, UnzipperInternal,
         getUnarchiverInternal } from './decompress-internal.js';
import { Unzipper, Unrarrer, Untarrer, getUnarchiver } from './decompress.js';

export {
  UnarchiveAppendEvent,
  UnarchiveErrorEvent,
  UnarchiveEvent,
  UnarchiveEventType,
  UnarchiveExtractEvent,
  UnarchiveFinishEvent,
  UnarchiveInfoEvent,
  UnarchiveProgressEvent,
  UnarchiveStartEvent,
  Unarchiver,
  Unzipper, Unrarrer, Untarrer, getUnarchiver
} 

console.error(`bitjs: Stop importing archive.js, this module will be removed. Import decompress.js instead.`);
