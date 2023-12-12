# Changelog

All notable changes to this project will be documented in this file.

## [1.1.7] - 2023-12-11

### Changed

- decompress: Allow unarchiving in Node.

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
