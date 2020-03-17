/**
 * File Sniffer.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2020 Google Inc.
 */

var bitjs = bitjs || {};
bitjs.file = bitjs.file || {};

(function() {

const fileSignatures = {
  'application/x-7z-compressed': [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07],
  'application/zip': [0x50, 0x4B],
  'image/bmp': [0x42, 0x4D],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/webp': [0x52, 0x49, 0x46, 0x46, '??', '??', '??', '??', 0x57, 0x45, 0x42, 0x50],
};

class Node {
  /** @param {number} value */
  constructor(value) {
    this.value = value;
    this.children = {};
    this.mimeType = undefined;
  }
}

// Top-level node in the tree.
const root = new Node();
let maxDepth = 0;

// Construct the tree, erroring if overlapping mime types are possible.
for (const mimeType in fileSignatures) {
  let curNode = root;
  let depth = 0;
  for (const byte of fileSignatures[mimeType]) {
    if (curNode.children[byte] === undefined) {
      if (byte === '??' && !curNode.children['??'] && Object.keys(curNode.children).length > 0) {
        throw 'Cannot add a placeholder child to a node that has non-placeholder children';
      } else if (byte !== '??' && curNode.children['??']) {
        throw 'Cannot add a non-placeholder child to a node that has a placeholder child';
      }
      curNode.children[byte] = new Node(byte);
    }
    depth++;
    curNode = curNode.children[byte];
  }
  if (maxDepth < depth) {
    maxDepth = depth;
  }

  if (curNode.mimeType) {
    throw `File signature collision:  ${curNode.mimeType} overlaps with ${mimeType}`;
  } else if (Object.keys(curNode.children).length > 0) {
    throw `${mimeType} signature is not unique, it collides with other mime types`;
  }
  curNode.mimeType = mimeType;
}

/**
 * @param {ArrayBuffer} ab
 * @return {string} The MIME type of the buffer, or undefined.
 */
bitjs.file.findMimeType = function(ab) {
  const depth = ab.byteLength < maxDepth ? ab.byteLength : maxDepth;
  const arr = new Uint8Array(ab).subarray(0, depth);
  let curNode = root;
  for (const byte of arr) {
    // If this node has a placeholder child, just step into it.
    if (curNode.children['??']) {
      curNode = curNode.children['??'];
      continue;
    }
    if (curNode.children[byte] === undefined) return undefined;
    curNode = curNode.children[byte];
    if (curNode.mimeType) return curNode.mimeType;
  }
};

})();
