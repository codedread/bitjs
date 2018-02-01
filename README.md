# bitjs: Binary Tools for JavaScript

## Introduction

A set of tools to handle binary data in JS (using Typed Arrays).

## Example Usage

### bitjs.io

This namespace includes stream objects for reading and writing binary data at the bit and byte level: BitStream, ByteStream.

```
var bstream = new bitjs.io.BitStream(someArrayBuffer, true, offset, length);
var crc = bstream.readBits(12); // read in 12 bits as CRC, advancing the pointer
var flagbits = bstream.peekBits(6); // look ahead at next 6 bits, but do not advance the pointer
```

### bitjs.archive

This namespace includes objects for unarchiving binary data in popular archive formats (zip, rar, tar) providing unzip, unrar and untar capabilities via JavaScript in the browser. The unarchiving actually happens inside a Web Worker.

```
var unzipper = new bitjs.archive.Unzipper(zipFileArrayBuffer);
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

function 
```

The unarchivers also support streaming, if you are receiving the zipped file from a slow place (a Cloud API, for instance).  For example:

```
var unzipper = new bitjs.archive.Unzipper(anArrayBufferWithStartingBytes);
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

## Tests

* [bitjs.io tests](https://codedread.github.io/bitjs/tests/io-test.html)
* [bitjs.archive tests](https://codedread.github.io/bitjs/tests/archive-test.html)

## Reference

* [UnRar](http://codedread.github.io/bitjs/docs/unrar.html): A work-in-progress description of the RAR file format.

## History

This project grew out of another project of mine, [kthoom](https://github.com/codedread/kthoom) (a comic book reader implemented in the browser).  This repository was automatically exported from [my original repository on GoogleCode](https://code.google.com/p/bitjs) and has undergone considerable changes and improvements since then, including adding streaming support, starter RarVM support, tests, many bug fixes, and updating the code to ES6.
