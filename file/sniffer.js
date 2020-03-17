/**
 * File Sniffer.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2020 Google Inc.
 */

const fileSignatures = {
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
};

// TODO: Build a tree of signature bytes that end in a MIME type.
class Node {
  /**
   * @param {number} value 
   */
  constructor(value) {
    this.value = value;
    this.children = {};
    this.mimeType = undefined;
  }
}

// Top-level node in the tree.
const root = new Node();
let maxDepth = 0;

// Construct the tree.
(function() {
  for (const mimeType in fileSignatures) {
    let curNode = root;
    let depth = 0;
    for (const byte of fileSignatures[mimeType]) {
      if (curNode.children[byte] === undefined) {
        curNode.children[byte] = new Node(byte);
      }
      depth++;
      curNode = curNode.children[byte];
    }
    if (maxDepth < depth) {
      maxDepth = depth;
    }
    curNode.mimeType = mimeType;
  }
})();

/**
 * @param {ArrayBuffer} ab
 * @return {string} The MIME type of the buffer, or undefined.
 */
export function findMimeType(ab) {
  const depth = ab.byteLength < maxDepth ? ab.byteLength : maxDepth;
  const arr = new Uint8Array(ab).subarray(0, depth);
  let curNode = root;
  for (const byte of arr) {
    if (curNode.children[byte] === undefined) return undefined;
    curNode = curNode.children[byte];
    if (curNode.mimeType) return curNode.mimeType;
  }
}

debugger;