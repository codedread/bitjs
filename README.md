# bitjs: Binary Tools for JavaScript

## Introduction

A set of tools to handle binary data in JS (using Typed Arrays).

## Example Usage

### bitjs.io

This namespace includes stream objects for reading and writing binary data at the bit and byte level: BitStream, ByteStream.

```javascript
import {BitStream} from './bitjs/io/bitstream.js';
const bstream = new BitStream(someArrayBuffer, true, offset, length);
const crc = bstream.readBits(12); // read in 12 bits as CRC, advancing the pointer
const flagbits = bstream.peekBits(6); // look ahead at next 6 bits, but do not advance the pointer
```

### bitjs.archive

This namespace includes objects for unarchiving binary data in popular archive formats (zip, rar, tar) providing unzip, unrar and untar capabilities via JavaScript in the browser. The unarchiving actually happens inside a Web Worker.

```javascript
const unzipper = new bitjs.archive.Unzipper(zipFileArrayBuffer);
unzipper.addEventListener('progress', updateProgress);
unzipper.addEventListener('extract', receiveOneFile);
unzipper.addEventListener('finish', displayZipContents);
unzipper.start();

function updateProgress(e) {
  // e.totalCompressedBytesRead has how many bytes have been unzipped so far
}

function receiveOneFile(e) {
  // e.unarchivedFile.filename: string
  // e.unarchivedFile.fileData: Uint8Array
}

function displayZipContents() {
  // Now sort your received files and show them or whatever...
}
```

The unarchivers also support streaming, if you are receiving the zipped file from a slow place (a Cloud API, for instance).  For example:

```javascript
const unzipper = new bitjs.archive.Unzipper(anArrayBufferWithStartingBytes);
unzipper.addEventListener('progress', updateProgress);
unzipper.addEventListener('extract', receiveOneFile);
unzipper.addEventListener('finish', displayZipContents);
unzipper.start();
...
// after some time
unzipper.update(anArrayBufferWithMoreBytes);
...
// after some more time
unzipper.update(anArrayBufferWithYetMoreBytes);
```

### bitjs.image

This namespace includes code for dealing with binary images.  It includes a module for converting WebP images into alternative raster graphics formats (PNG/JPG).

```javascript
import {convertWebPtoPNG, convertWebPtoJPG} from './bitjs/image/webp-shim/webp-shim.js';

// convertWebPtoPNG() takes in an ArrayBuffer containing the bytes of a WebP
// image and returns a Promise that resolves with an ArrayBuffer containing the
// bytes of an equivalent PNG image.
convertWebPtoPNG(webpBuffer).then(pngBuf => {
  const pngUrl = URL.createObjectURL(new Blob([pngBuf], {type: 'image/png'}));
  someImgElement.setAttribute(src, pngUrl);
});
```

### bitjs.file

This namespace includes code for dealing with files.  It includes a sniffer which detects the type of file, given an ArrayBuffer.

```javascript
const mimeType = bitjs.file.findMimeType(someArrayBuffer);
```

## Tests

* [bitjs.io tests](https://codedread.github.io/bitjs/tests/io-test.html)
* [bitjs.archive tests](https://codedread.github.io/bitjs/tests/archive-test.html)

## Reference

* [UnRar](http://codedread.github.io/bitjs/docs/unrar.html): A work-in-progress description of the RAR file format.

## History

This project grew out of another project of mine, [kthoom](https://github.com/codedread/kthoom) (a comic book reader implemented in the browser).  This repository was automatically exported from [my original repository on GoogleCode](https://code.google.com/p/bitjs) and has undergone considerable changes and improvements since then, including adding streaming support, starter RarVM support, tests, many bug fixes, and updating the code to ES6.
