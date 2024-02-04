/**
 * inflate.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2024 Google Inc.
 *
 * Implementation of INFLATE. Uses DecompressionStream, if the runtime supports it, otherwise uses
 * an implementation purely in JS.
 *
 * Reference Documentation:
 *
 * DEFLATE format: http://tools.ietf.org/html/rfc1951
 */

import { BitStream } from '../io/bitstream.js';
import { ByteBuffer } from '../io/bytebuffer.js';

/**
 * @typedef SymbolLengthPair
 * @property {number} length
 * @property {number} symbol
 */

/**
 * Returns a table of Huffman codes. Each entry's key is its code and its value is a JavaScript
 * object containing {length: 6, symbol: X}.
 * @param {number[]} bitLengths An array representing the bit lengths of the codes, in order.
 *     See section 3.2.2 of https://datatracker.ietf.org/doc/html/rfc1951.
 * @returns {Map<number, SymbolLengthPair>}
 */
function getHuffmanCodes(bitLengths) {
  // ensure bitLengths is an array containing at least one element
  if (typeof bitLengths != typeof [] || bitLengths.length < 1) {
    err('Error! getHuffmanCodes() called with an invalid array');
    return null;
  }

  // Reference: http://tools.ietf.org/html/rfc1951#page-8
  const numLengths = bitLengths.length;
  const bl_count = [];
  let MAX_BITS = 1;

  // Step 1: count up how many codes of each length we have
  for (let i = 0; i < numLengths; ++i) {
    const length = bitLengths[i];
    // test to ensure each bit length is a positive, non-zero number
    if (typeof length != typeof 1 || length < 0) {
      err(`bitLengths contained an invalid number in getHuffmanCodes(): ${length} of type ${typeof length}`);
      return null;
    }
    // increment the appropriate bitlength count
    if (bl_count[length] == undefined) bl_count[length] = 0;
    // a length of zero means this symbol is not participating in the huffman coding
    if (length > 0) bl_count[length]++;
    if (length > MAX_BITS) MAX_BITS = length;
  }

  // Step 2: Find the numerical value of the smallest code for each code length
  const next_code = [];
  let code = 0;
  for (let bits = 1; bits <= MAX_BITS; ++bits) {
    const length = bits - 1;
    // ensure undefined lengths are zero
    if (bl_count[length] == undefined) bl_count[length] = 0;
    code = (code + bl_count[bits - 1]) << 1;
    next_code[bits] = code;
  }

  // Step 3: Assign numerical values to all codes
  /** @type Map<number, SymbolLengthPair> */
  const table = new Map();
  for (let n = 0; n < numLengths; ++n) {
    const len = bitLengths[n];
    if (len != 0) {
      table.set(next_code[len], { length: len, symbol: n });
      next_code[len]++;
    }
  }

  return table;
}

/*
     The Huffman codes for the two alphabets are fixed, and are not
     represented explicitly in the data.  The Huffman code lengths
     for the literal/length alphabet are:

               Lit Value    Bits        Codes
               ---------    ----        -----
                 0 - 143     8          00110000 through
                                        10111111
               144 - 255     9          110010000 through
                                        111111111
               256 - 279     7          0000000 through
                                        0010111
               280 - 287     8          11000000 through
                                        11000111
*/
// fixed Huffman codes go from 7-9 bits, so we need an array whose index can hold up to 9 bits
let fixedHCtoLiteral = null;
let fixedHCtoDistance = null;
/** @returns {Map<number, SymbolLengthPair>} */
function getFixedLiteralTable() {
  // create once
  if (!fixedHCtoLiteral) {
    const bitlengths = new Array(288);
    for (let i = 0; i <= 143; ++i) bitlengths[i] = 8;
    for (let i = 144; i <= 255; ++i) bitlengths[i] = 9;
    for (let i = 256; i <= 279; ++i) bitlengths[i] = 7;
    for (let i = 280; i <= 287; ++i) bitlengths[i] = 8;

    // get huffman code table
    fixedHCtoLiteral = getHuffmanCodes(bitlengths);
  }
  return fixedHCtoLiteral;
}

/** @returns {Map<number, SymbolLengthPair>} */
function getFixedDistanceTable() {
  // create once
  if (!fixedHCtoDistance) {
    const bitlengths = new Array(32);
    for (let i = 0; i < 32; ++i) { bitlengths[i] = 5; }

    // get huffman code table
    fixedHCtoDistance = getHuffmanCodes(bitlengths);
  }
  return fixedHCtoDistance;
}

/**
 * Extract one bit at a time until we find a matching Huffman Code
 * then return that symbol.
 * @param {BitStream} bstream
 * @param {Map<number, SymbolLengthPair>} hcTable
 * @returns {number}
 */
function decodeSymbol(bstream, hcTable) {
  let code = 0;
  let len = 0;

  // loop until we match
  for (; ;) {
    // read in next bit
    const bit = bstream.readBits(1);
    code = (code << 1) | bit;
    ++len;

    // check against Huffman Code table and break if found
    if (hcTable.has(code) && hcTable.get(code).length == len) {
      break;
    }
    if (len > hcTable.length) {
      err(`Bit stream out of sync, didn't find a Huffman Code, length was ${len} ` +
        `and table only max code length of ${hcTable.length}`);
      break;
    }
  }
  return hcTable.get(code).symbol;
}


const CodeLengthCodeOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

/*
     Extra               Extra               Extra
Code Bits Length(s) Code Bits Lengths   Code Bits Length(s)
---- ---- ------     ---- ---- -------   ---- ---- -------
 257   0     3       267   1   15,16     277   4   67-82
 258   0     4       268   1   17,18     278   4   83-98
 259   0     5       269   2   19-22     279   4   99-114
 260   0     6       270   2   23-26     280   4  115-130
 261   0     7       271   2   27-30     281   5  131-162
 262   0     8       272   2   31-34     282   5  163-194
 263   0     9       273   3   35-42     283   5  195-226
 264   0    10       274   3   43-50     284   5  227-257
 265   1  11,12      275   3   51-58     285   0    258
 266   1  13,14      276   3   59-66
*/
const LengthLookupTable = [
  [0, 3], [0, 4], [0, 5], [0, 6],
  [0, 7], [0, 8], [0, 9], [0, 10],
  [1, 11], [1, 13], [1, 15], [1, 17],
  [2, 19], [2, 23], [2, 27], [2, 31],
  [3, 35], [3, 43], [3, 51], [3, 59],
  [4, 67], [4, 83], [4, 99], [4, 115],
  [5, 131], [5, 163], [5, 195], [5, 227],
  [0, 258]
];

/*
      Extra           Extra                Extra
 Code Bits Dist  Code Bits   Dist     Code Bits Distance
 ---- ---- ----  ---- ----  ------    ---- ---- --------
   0   0    1     10   4     33-48    20    9   1025-1536
   1   0    2     11   4     49-64    21    9   1537-2048
   2   0    3     12   5     65-96    22   10   2049-3072
   3   0    4     13   5     97-128   23   10   3073-4096
   4   1   5,6    14   6    129-192   24   11   4097-6144
   5   1   7,8    15   6    193-256   25   11   6145-8192
   6   2   9-12   16   7    257-384   26   12  8193-12288
   7   2  13-16   17   7    385-512   27   12 12289-16384
   8   3  17-24   18   8    513-768   28   13 16385-24576
   9   3  25-32   19   8   769-1024   29   13 24577-32768
*/
const DistLookupTable = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 5], [1, 7],
  [2, 9], [2, 13],
  [3, 17], [3, 25],
  [4, 33], [4, 49],
  [5, 65], [5, 97],
  [6, 129], [6, 193],
  [7, 257], [7, 385],
  [8, 513], [8, 769],
  [9, 1025], [9, 1537],
  [10, 2049], [10, 3073],
  [11, 4097], [11, 6145],
  [12, 8193], [12, 12289],
  [13, 16385], [13, 24577]
];

/**
 * @param {BitStream} bstream
 * @param {Map<number, SymbolLengthPair>} hcLiteralTable
 * @param {Map<number, SymbolLengthPair>} hcDistanceTable
 * @param {ByteBuffer} buffer
 * @returns 
 */
function inflateBlockData(bstream, hcLiteralTable, hcDistanceTable, buffer) {
  /*
      loop (until end of block code recognized)
         decode literal/length value from input stream
         if value < 256
            copy value (literal byte) to output stream
         otherwise
            if value = end of block (256)
               break from loop
            otherwise (value = 257..285)
               decode distance from input stream

               move backwards distance bytes in the output
               stream, and copy length bytes from this
               position to the output stream.
  */
  let blockSize = 0;
  for (; ;) {
    const symbol = decodeSymbol(bstream, hcLiteralTable);
    if (symbol < 256) {
      // copy literal byte to output
      buffer.insertByte(symbol);
      blockSize++;
    } else {
      // end of block reached
      if (symbol == 256) {
        break;
      } else {
        const lengthLookup = LengthLookupTable[symbol - 257];
        let length = lengthLookup[1] + bstream.readBits(lengthLookup[0]);
        const distLookup = DistLookupTable[decodeSymbol(bstream, hcDistanceTable)];
        let distance = distLookup[1] + bstream.readBits(distLookup[0]);

        // now apply length and distance appropriately and copy to output

        // TODO: check that backward distance < data.length?

        // http://tools.ietf.org/html/rfc1951#page-11
        // "Note also that the referenced string may overlap the current
        //  position; for example, if the last 2 bytes decoded have values
        //  X and Y, a string reference with <length = 5, distance = 2>
        //  adds X,Y,X,Y,X to the output stream."
        //
        // loop for each character
        let ch = buffer.ptr - distance;
        blockSize += length;
        if (length > distance) {
          const data = buffer.data;
          while (length--) {
            buffer.insertByte(data[ch++]);
          }
        } else {
          buffer.insertBytes(buffer.data.subarray(ch, ch + length))
        }
      } // length-distance pair
    } // length-distance pair or end-of-block
  } // loop until we reach end of block
  return blockSize;
}

/**
 * Compression method 8. Deflate: http://tools.ietf.org/html/rfc1951
 * @param {Uint8Array} compressedData A Uint8Array of the compressed file data.
 * @param {number} numDecompressedBytes
 * @returns {Promise<Uint8Array>} The decompressed array.
 */
export async function inflate(compressedData, numDecompressedBytes) {
  // Try to use native implementation of DEFLATE if it exists.
  try {
    const blob = new Blob([compressedData.buffer]);
    const decompressedStream = blob.stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(decompressedStream).arrayBuffer());
  } catch (err) {
    // Fall through to non-native implementation of DEFLATE.
  }
  
  // Bit stream representing the compressed data.
  /** @type {BitStream} */
  const bstream = new BitStream(compressedData.buffer,
    false /* mtl */,
    compressedData.byteOffset,
    compressedData.byteLength);
  /** @type {ByteBuffer} */
  const buffer = new ByteBuffer(numDecompressedBytes);
  let blockSize = 0;

  // block format: http://tools.ietf.org/html/rfc1951#page-9
  let bFinal = 0;
  do {
    bFinal = bstream.readBits(1);
    let bType = bstream.readBits(2);
    blockSize = 0;
    // no compression
    if (bType == 0) {
      // skip remaining bits in this byte
      while (bstream.bitPtr != 0) bstream.readBits(1);
      const len = bstream.readBits(16);
      const nlen = bstream.readBits(16);
      // TODO: check if nlen is the ones-complement of len?
      if (len > 0) buffer.insertBytes(bstream.readBytes(len));
      blockSize = len;
    }
    // fixed Huffman codes
    else if (bType == 1) {
      blockSize = inflateBlockData(bstream, getFixedLiteralTable(), getFixedDistanceTable(), buffer);
    }
    // dynamic Huffman codes
    else if (bType == 2) {
      const numLiteralLengthCodes = bstream.readBits(5) + 257;
      const numDistanceCodes = bstream.readBits(5) + 1;
      const numCodeLengthCodes = bstream.readBits(4) + 4;

      // populate the array of code length codes (first de-compaction)
      const codeLengthsCodeLengths = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < numCodeLengthCodes; ++i) {
        codeLengthsCodeLengths[CodeLengthCodeOrder[i]] = bstream.readBits(3);
      }

      // get the Huffman Codes for the code lengths
      const codeLengthsCodes = getHuffmanCodes(codeLengthsCodeLengths);

      // now follow this mapping
      /*
        0 - 15: Represent code lengths of 0 - 15
            16: Copy the previous code length 3 - 6 times.
                The next 2 bits indicate repeat length
                (0 = 3, ... , 3 = 6)
                Example:  Codes 8, 16 (+2 bits 11),
                          16 (+2 bits 10) will expand to
                          12 code lengths of 8 (1 + 6 + 5)
            17: Repeat a code length of 0 for 3 - 10 times.
                (3 bits of length)
            18: Repeat a code length of 0 for 11 - 138 times
                (7 bits of length)
      */
      // to generate the true code lengths of the Huffman Codes for the literal
      // and distance tables together
      const literalCodeLengths = [];
      let prevCodeLength = 0;
      const maxCodeLengths = numLiteralLengthCodes + numDistanceCodes;
      while (literalCodeLengths.length < maxCodeLengths) {
        const symbol = decodeSymbol(bstream, codeLengthsCodes);
        if (symbol <= 15) {
          literalCodeLengths.push(symbol);
          prevCodeLength = symbol;
        } else if (symbol === 16) {
          let repeat = bstream.readBits(2) + 3;
          while (repeat--) {
            literalCodeLengths.push(prevCodeLength);
          }
        } else if (symbol === 17) {
          let repeat = bstream.readBits(3) + 3;
          while (repeat--) {
            literalCodeLengths.push(0);
          }
        } else if (symbol == 18) {
          let repeat = bstream.readBits(7) + 11;
          while (repeat--) {
            literalCodeLengths.push(0);
          }
        }
      }

      // now split the distance code lengths out of the literal code array
      const distanceCodeLengths = literalCodeLengths.splice(numLiteralLengthCodes, numDistanceCodes);

      // now generate the true Huffman Code tables using these code lengths
      const hcLiteralTable = getHuffmanCodes(literalCodeLengths);
      const hcDistanceTable = getHuffmanCodes(distanceCodeLengths);
      blockSize = inflateBlockData(bstream, hcLiteralTable, hcDistanceTable, buffer);
    } else { // error
      err('Error! Encountered deflate block of type 3');
      return null;
    }
  } while (bFinal != 1);
  // we are done reading blocks if the bFinal bit was set for this block

  // return the buffer data bytes
  return buffer.data;
}
