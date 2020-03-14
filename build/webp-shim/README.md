# WebP Shim

## Prerequisites
  * Install Docker
  * git clone this repository

## Build Instructions
Assuming you have cloned the repository in /path/to/bitjs:
  * cd /path/to/bitjs/build/webp-shim/
  * Build the Docker image: `docker build -f Dockerfile -t wps/0.1 .`
  * Run the Docker image: `docker run -it --mount type=bind,source=/path/to/bitjs/image/webp-shim,target=/out wps/0.1`
  * Build the WASM module: `make`
  * Exit the Docker image: `exit`

The /path/to/bitjs/image/webp-shim/ directory will now contain update webp-shim-module.js and webp-shim-module.wasm files.
