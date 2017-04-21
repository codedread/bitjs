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

This namespace includes objects for unarchiving binary data in popular archive formats (zip, rar, tar) providing unzip, unrar and untar capabilities via JavaScript in the browser. The unarchive code depends on browser support of Web Workers. See the design doc.

```
function updateProgressBar(e) { ... update UI element ... }
function displayZipContents(e) { ... display contents of the extracted zip file ... }

var unzipper = new bitjs.archive.Unzipper(zipFileArrayBuffer);
unzipper.addEventListener("progress", updateProgressBar);
unzipper.addEventListener("finish", displayZipContents);
unzipper.start();
```

## Tests

* [bitjs.io tests](https://codedread.github.io/bitjs/tests/io-test.html)
* [bitjs.archive tests](https://codedread.github.io/bitjs/tests/archive-test.html)

## Reference

* [UnRar](http://codedread.github.io/bitjs/docs/unrar.html): An work-in-progress description of the RAR file format.

## History

This repository was automatically exported from [my original repository on GoogleCode] (https://code.google.com/p/bitjs) and then I cherry-picked some commits from antimatter15's fork.  I've also fixed a bunch of bugs, added starter RarVM support, added tests and updated to ES6.
