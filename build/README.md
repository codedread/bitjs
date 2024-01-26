# Build

This folder contains files needed to build various pieces of the library.  You only need to worry
about this if you intend on patching / modifying the library in some way. It is only needed for the
WebP Shim parts of bitjs.

## Prerequisites
  * Install Docker
  * git clone this repository

## Build Instructions

Assuming you have cloned the repository in /path/to/bitjs:
  * cd /path/to/bitjs/build/
  * Build the Docker image: `docker build -f Dockerfile -t wps/0.1 .`
  * Run the Docker image: `docker run -it --mount type=bind,source=/path/to/bitjs/,target=/out wps/0.1`
  * Build the library: `make`
  * Exit the Docker image: `exit`

Various library files will be output to /path/to/bitjs/.  For example, the
/path/to/bitjs/image/webp-shim/ directory will now contain update webp-shim-module.js and
webp-shim-module.wasm files.

# TODO(2.0): Remove this.
