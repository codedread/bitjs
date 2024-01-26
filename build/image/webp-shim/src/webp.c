/**
 * webp.c
 *
 * Provides functionality for decoding a WebP image and converting it into
 * alternative raster graphics formats (PNG/JPG).
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2020 Google Inc.
 */

// TODO(2.0): Remove this. It seems unnecessary given WebP is universally supported now.

#include <stdio.h>
#include <stdlib.h>
#include "emscripten.h"
#include "src/webp/decode.h"

#define STBI_WRITE_NO_STDIO
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"
#include "stretchy_buffer.h"

// Method to create buffers to transfer data into wasm.
EMSCRIPTEN_KEEPALIVE uint8_t* create_buffer(int size) { return malloc(size * sizeof(uint8_t)); }
EMSCRIPTEN_KEEPALIVE void destroy_buffer(uint8_t* p) { free(p); }

// ImageBuffer is a struct representing information about the image data.
// TODO: Use embind to make this a C++ class?
typedef struct {
  size_t byte_count;
  uint8_t* bytes; // A stretchy buffer.
} ImageBuffer;

// Methods to get ImageBuffer fields.
EMSCRIPTEN_KEEPALIVE uint8_t* get_image_bytes_from_handle(ImageBuffer* p) { return p->bytes; }
EMSCRIPTEN_KEEPALIVE size_t get_num_bytes_from_handle(ImageBuffer* p) { return p->byte_count; }
EMSCRIPTEN_KEEPALIVE void release_image_handle(ImageBuffer* image_buffer) {
  if (image_buffer) {
    sb_free(image_buffer->bytes);
    free(image_buffer);
  }
}

ImageBuffer* createImageBuffer() {
  ImageBuffer* image_buffer = (ImageBuffer*) malloc(sizeof(ImageBuffer));
  image_buffer->byte_count = 0;
  image_buffer->bytes = NULL;
  return image_buffer;
}

void write_image_to_mem(void* context, void* data, int size) {
  ImageBuffer* image_buffer = (ImageBuffer*) context;  

  // If the buffer is not big enough for the new data, grow it.
  int size_of_buffer = sb_count(image_buffer->bytes);
  if (size_of_buffer < image_buffer->byte_count + size) {
    sb_add(image_buffer->bytes, size < 128 ? 128 : size);
  }

  uint8_t* start_ptr = image_buffer->bytes + image_buffer->byte_count;
  memcpy(start_ptr, data, size);
  image_buffer->byte_count += size;
}

uint8_t* decode_webp_to_rgba(uint8_t* webp_ptr, size_t size, int* width, int* height) {
  if (!webp_ptr) {
    printf("decode_webp_to_rgba() called with NULL webp_ptr");
  }
  if (!WebPGetInfo(webp_ptr, size, width, height)) {
    fprintf(stderr, "WebPGetInfo() returned an error\n");
    return NULL;
  }
  uint8_t* rgba_ptr = WebPDecodeRGBA(webp_ptr, size, width, height);
  return rgba_ptr;
}

EMSCRIPTEN_KEEPALIVE ImageBuffer* get_png_handle_from_webp(uint8_t* webp_ptr, size_t size) {
  int width, height;
  uint8_t* rgba_ptr = decode_webp_to_rgba(webp_ptr, size, &width, &height);
  if (!rgba_ptr) {
    return NULL;
  }

  ImageBuffer* image_buffer = createImageBuffer();
  int result = stbi_write_png_to_func(write_image_to_mem, image_buffer, width, height, 4,
                                      rgba_ptr, width * 4);
  WebPFree(rgba_ptr);
  if (!result) {
    return NULL;
  }
  return image_buffer;
}

EMSCRIPTEN_KEEPALIVE ImageBuffer* get_jpg_handle_from_webp(uint8_t* webp_ptr, size_t size) {
  int width, height;
  uint8_t* rgba_ptr = decode_webp_to_rgba(webp_ptr, size, &width, &height);
  if (!rgba_ptr) {
    return NULL;
  }

  ImageBuffer* image_buffer = createImageBuffer();
  int result = stbi_write_jpg_to_func(write_image_to_mem, image_buffer, width, height, 4,
                                      rgba_ptr, 100);
  WebPFree(rgba_ptr);
  if (!result) {
    return NULL;
  }
  return image_buffer;
}
