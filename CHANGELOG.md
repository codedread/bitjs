# Changelog

All notable changes to this project will be documented in this file.

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
