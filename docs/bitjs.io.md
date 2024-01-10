# bitjs.io

This package includes stream objects for reading and writing binary data at the bit and byte level:
BitStream, ByteStream.

Streams are given an ArrayBuffer of bytes and keeps track of where in the stream you are. As you 
read through the stream, the pointer is advanced through the buffer. If you need to peek at a number
without advancing the pointer, use the `peek` methods.

## BitStream

A bit stream is a way to read a variable number of bits from a series of bytes. This is useful for
parsing certain protocols (for example pkzip or rar algorithm). Note that the order of reading
bits can go from least-to-most significant bit, or the reverse.

### Least-to-Most Direction

![BitStream reading from least-to-most significant bit](bitstream-ltm.png)

```javascript
const bstream = new BitStream(ab, false /* mtl */);
bstream.readBits(6); // (blue)  0b001011 = 11
bstream.readBits(5); // (red)   0b11001 = 25
bstream.readBits(8); // (green) 0b10000010 = 130
```

### Most-to-Least Direction

![BitStream reading from most-to-least significant bit](bitstream-mtl.png)

```javascript
const bstream = new BitStream(ab, true /* mtl */);
bstream.readBits(6); // (blue)  0b010010 = 18
bstream.readBits(5); // (red)   0b11000 = 24
bstream.readBits(8); // (green) 0b10110100 = 180
```

## ByteStream

A ByteStream is a convenient way to read numbers and ASCII strings from a set of bytes. For example,
interpreting 2 bytes in the stream as a number is done by calling `someByteStream.readNumber(2)`. By
default, the byte stream is considered Little Endian, but can be changed at any point using
`someByteStream.setBigEndian()` and toggled back with `someByteStream.setLittleEndian()`.

If you need to peek at bytes without advancing the pointer, use the `peek` methods.

By default, numbers are unsigned, but `peekSignedNumber(n)` and `readSignedNumber(n)` exist for
signed numbers.

```javascript
  const byteStream = new ByteStream(someArrayBuffer);
  byteStream.setBigEndian();
  byteStream.skip(2); // skip two bytes.
  // Interpret next 2 bytes as the string length.
  const strLen = byteStream.readNumber(2); 
  // Read in bytes as an ASCII string.
  const someString = byteStream.readString(strLen);
  // Interpret next byte as an int8 (0xFF would be -1).
  const someVal = byteStream.readSignedNumber(1);
  ...
```

### Appending to the Stream

If you get more bytes (for example, from an asynchronous process), you can add them to the end of
the byte stream by using `someByteStream.push(nextBytesAsAnArrayBuffer)`.

### Forking / Teeing the stream.

If you have a need to seek ahead to a different section of the stream of bytes, and want to later
return to where you left off, you should use `tee()` method to make a copy of the ByteStream. This
will let you seek to the appropriate spot to grab some bytes using the teed stream, while you can
pick up where you left off with the original stream.

```javascript
  const origStream = new ByteStream(someArrayBuffer);
  const strLen = origStream.readNumber(4); // Bytes 0-3.
  const strOffset = origStream.readNumber(4); // Bytes 4-7.
  
  const teedStream = origStream.tee();
  const description = teedStream.skip(strOffset).readString(strLen);
  
  const someOtherVal = origStream.readNumber(4); // Bytes 8-11
```

Note that the teed stream is not "connected" to the original stream. If you push new bytes to the
original stream, the teed stream does not see them. If you find this behavior unexpected, please
file a bug.
