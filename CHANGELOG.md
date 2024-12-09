# Changelog

All notable changes to this project will be documented in this file.

## [1.2.4] - 2024-12-08

### Fixed

- Fixed import error in unrar/rarvm.

## [1.2.3] - 2024-02-04

### Added

- archive: Support semantic methods for subscribing to unarchive events (onExtract),
 [Issue #47](https://github.com/codedread/bitjs/issues/47).
- archive: Added Gunzipper to decompress gzip files. Only supported on runtimes that supported
  DecompressionStream('gzip') for now. [Issue #48](https://github.com/codedread/bitjs/issues/48).
- io: Added a getData() method to ByteBuffer to retrieve a copy of the bytes that have been written.

### Changed

- archive: Unrarrer throws an explicit error when encountering RAR5 files.
- io: ByteBuffer.insertXXX() now throws an error if trying to write past the end of the buffer.

## [1.2.2] - 2024-01-26

### Added

- archive: Support DEFLATE in Zipper where JS implementations support it in CompressionStream.
  [Issue #40](https://github.com/codedread/bitjs/issues/40)
- archive: Support DEFLATE in Unzipper where JS implementations support it in DecompressionStream.
  [Issue #38](https://github.com/codedread/bitjs/issues/38)
- file: Added detection of GZIP files.
- io: Added a skip() method to BitStream to match ByteStream.

### Fixed

- Fixed a benign JS error in the Web Worker wrapper

## [1.2.1] - 2024-01-19

### Added

- image: Added PNG event-based parser (all critical and most ancillary chunks).

### Changed

- io: Fix ByteStream bug where skip(0) did not return the ByteStream.

### Removed

- image: Removed all custom parser Events and just use CustomEvent.

## [1.2.0] - 2024-01-15

### Added

- image: Added GIF and JPEG event-based parsers.
- io: Added a skip() method to ByteStream.

## [1.1.7] - 2023-12-16

### Changed

- archive: Enable unarchiving/archiving in NodeJS.
- Update unit test coverage and documentation.

## [1.1.6] - 2023-10-25

### Changed

- codecs: Special handling for mp3 streams inside mp4 containers.
- codecs: Handle ffprobe level -99 in mp4 files.

## [1.1.5] - 2023-10-22

### Changed

- codecs: Add support for HE-AAC profile in mp4a.

## [1.1.4] - 2023-10-19

### Changed

- codecs: Add support for DTS audio codec and AV1 video codec.
- codecs: Update how Matroska video/audio files are detected (video/x-matroska).
  [Issue #43](https://github.com/codedread/bitjs/issues/43)
- untar: Fix long path/filenames in 'ustar' format. [Issue #42](https://github.com/codedread/bitjs/issues/43)

## [1.1.3] - 2023-10-15

### Changed

- codecs: Add support for WAV files to getShortMIMEString() and getFullMIMEString().
- codecs: Fix support for AVI files in getFullMIMEString().

## [1.1.2] - 2023-09-30

### Changed

- codecs: Handle m4a files as audio/mp4.

## [1.1.1] - 2023-06-21

### Changed

- Fix missing RarVM import in unrar.js.

## [1.1.0] - 2023-05-28

### Added

- Starter thinking around a Media API.

### Changed

- Change console.warn to a console.error when importing archive.js.

### Removed

- Removed build step for bitjs.io now that all browsers (Firefox 114+) support ES Module Workers.

## [1.0.11] - 2023-02-15

### Added

- Add sniffer support for the ICO format.
- Add unit test coverage via c8.

### Fixed

- Fixes for the audio/flac codec type.
