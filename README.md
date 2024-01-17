[![Node.js CI](https://github.com/codedread/bitjs/actions/workflows/node.js.yml/badge.svg)](https://github.com/codedread/bitjs/actions/workflows/node.js.yml)

# bitjs: Binary Tools for JavaScript

## Introduction

A set of dependency-free JavaScript modules to handle binary data in JS (using
[Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)).
Includes:

  * bitjs/archive: Unarchiving files (unzip, unrar, untar) in JavaScript,
    implemented as Web Workers where supported, and allowing progressive
    unarchiving while streaming.
  * bitjs/codecs: Get the codec info of media containers in a ISO RFC6381
    MIME type string
  * bitjs/file: Detect the type of file from its binary signature.
  * bitjs/image: Parsing GIF, JPEG. Conversion of WebP to PNG or JPEG.
  * bitjs/io: Low-level classes for interpreting binary data (BitStream
    ByteStream).  For example, reading or peeking at N bits at a time.

## Installation

Install it using your favourite package manager, the package is registered under `@codedread/bitjs`.
```bash
npm install @codedread/bitjs
```
or
```bash
yarn add @codedread/bitjs
```

### CommonJS/ESM in Node

This module is an ES Module, which should work as expected in other projects using ES Modules.
However, if you are using CommonJS modules, it's a little trickier to use. One example of this is
if a TypeScript project compiles to CommonJS, it will try to turn imports into require() statements,
which will break. The fix for this (unfortunately) is to update your tsconfig.json:

```json
 "moduleResolution": "Node16",
```

and use a Dynamic Import:

```javascript
const { getFullMIMEString } = await import('@codedread/bitjs');
```

## Packages

### bitjs.archive

This package includes objects for unarchiving binary data in popular archive formats (zip, rar, tar).
Here is a simple example of unrar:

#### Decompressing

```javascript
import { Unrarrer } from './bitjs/archive/decompress.js';
const unrar = new Unrarrer(rarFileArrayBuffer);
unrar.addEventListener('extract', (e) => {
  const {filename, fileData} = e.unarchivedFile;
  console.log(`Extracted ${filename} (${fileData.byteLength} bytes)`);
  // Do something with fileData...
});
unrar.addEventListener('finish', () => console.log('Done'));
unrar.start();
```

More explanation and examples are located on [the API page](./docs/bitjs.archive.md).

### bitjs.codecs

This package includes code for dealing with media files (audio/video). It is useful for deriving
ISO RFC6381 MIME type strings, including the codec information. Currently supports a limited subset
of MP4 and WEBM.

How to use:
  * First, install ffprobe (ffmpeg) on your system.
  * Then:
```javascript

import { getFullMIMEString } from 'bitjs/codecs/codecs.js';
/**
 * @typedef {import('bitjs/codecs/codecs.js').ProbeInfo} ProbeInfo
 */

const cmd = 'ffprobe -show_format -show_streams -print_format json -v quiet foo.mp4';
exec(cmd, (error, stdout) => {
  /** @type {ProbeInfo} */
  const info = JSON.parse(stdout);
  // 'video/mp4; codecs="avc1.4D4028, mp4a.40.2"'
  const contentType = getFullMIMEString(info);
  ...
});
```

### bitjs.file

This package includes code for dealing with files.  It includes a sniffer which detects the type of
file, given an ArrayBuffer.

```javascript
import { findMimeType } from './bitjs/file/sniffer.js';
const mimeType = findMimeType(someArrayBuffer);
```

### bitjs.image

This package includes code for dealing with binary images.  It includes general event-based parsers
for images (GIF, JPEG, PNG). It also includes a module for converting WebP images
into alternative raster graphics formats (PNG/JPG). This latter module is deprecated, now that WebP
images are well-supported in all browsers.

#### GIF Parser
```javascript
import { GifParser } from './bitjs/image/parsers/gif.js'

const parser = new GifParser(someArrayBuffer);
parser.onApplicationExtension(evt => {
  const appId = evt.applicationExtension.applicationIdentifier;
  const appAuthCode = new TextDecoder().decode(
      evt.applicationExtension.applicationAuthenticationCode);
  if (appId === 'XMP Data' && appAuthCode === 'XMP') {
    /** @type {Uint8Array} */
    const appData = evt.applicationExtension.applicationData;
    // Do something with appData (parse the XMP).
  }
});
parser.start();
```

#### JPEG Parser
```javascript
import { JpegParser } from './bitjs/image/parsers/jpeg.js'
import { ExifTagNumber } from './bitjs/image/parsers/exif.js';

const parser = new JpegParser(someArrayBuffer);
parser.onApp1Exif(evt => {
  console.log(evt.exifValueMap.get(ExifTagNumber.IMAGE_DESCRIPTION).stringValue);
});
await parser.start();
```

#### WebP Converter
```javascript
import { convertWebPtoPNG, convertWebPtoJPG } from './bitjs/image/webp-shim/webp-shim.js';
// convertWebPtoPNG() takes in an ArrayBuffer containing the bytes of a WebP
// image and returns a Promise that resolves with an ArrayBuffer containing the
// bytes of an equivalent PNG image.
convertWebPtoPNG(webpBuffer).then(pngBuf => {
  const pngUrl = URL.createObjectURL(new Blob([pngBuf], {type: 'image/png'}));
  someImgElement.setAttribute(src, pngUrl);
});
```

### bitjs.io

This package includes stream objects for reading and writing binary data at the bit and byte level:
BitStream, ByteStream.

```javascript
import { BitStream } from './bitjs/io/bitstream.js';
const bstream = new BitStream(someArrayBuffer, true, offset, length);
const crc = bstream.readBits(12); // read in 12 bits as CRC, advancing the pointer
const flagbits = bstream.peekBits(6); // look ahead at next 6 bits, but do not advance the pointer
```

More explanation and examples are located on [the API page](./docs/bitjs.io.md).

## Reference

* [UnRar](http://codedread.github.io/bitjs/docs/unrar.html): A work-in-progress description of the
RAR file format.

## History

This project grew out of another project of mine, [kthoom](https://github.com/codedread/kthoom) (a
comic book reader implemented in the browser).  This repository was automatically exported from
[my original repository on GoogleCode](https://code.google.com/p/bitjs) and has undergone
considerable changes and improvements since then, including adding streaming support, starter RarVM
support, tests, many bug fixes, and updating the code to modern JavaScript and supported features.
