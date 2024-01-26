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

// TODO(2.0): When up-revving to a major new version, remove this module.

import { UnarchiveAppendEvent, UnarchiveErrorEvent, UnarchiveEvent, UnarchiveEventType,
         UnarchiveExtractEvent, UnarchiveFinishEvent, UnarchiveInfoEvent,
         UnarchiveProgressEvent, UnarchiveStartEvent } from './events.js';
import { Unarchiver, Unzipper, Unrarrer, Untarrer, getUnarchiver } from './decompress.js';

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
