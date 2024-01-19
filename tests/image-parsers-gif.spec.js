import * as fs from 'node:fs';
import 'mocha';
import { expect } from 'chai';
import { GifParser } from '../image/parsers/gif.js';

const COMMENT_GIF = `tests/image-testfiles/comment.gif`;
const XMP_GIF = 'tests/image-testfiles/xmp.gif';

describe('bitjs.image.parsers.GifParser', () => {
  it('parses GIF with Comment Extension', async () => {
    const nodeBuf = fs.readFileSync(COMMENT_GIF);
    const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);

    const parser = new GifParser(ab);
    let trailerFound = false;
    let comment;
    parser.onLogicalScreen(evt => {
      const {logicalScreenWidth, logicalScreenHeight} = evt.detail;
      expect(logicalScreenWidth).equals(32);
      expect(logicalScreenHeight).equals(52);
    });
    parser.onTableBasedImage(evt => {
      const {imageWidth, imageHeight} = evt.detail;
      expect(imageWidth).equals(32);
      expect(imageHeight).equals(52);
    });
    parser.onCommentExtension(evt => comment = evt.detail);
    parser.onTrailer(evt => trailerFound = true);

    await parser.start();
    
    expect(trailerFound).equals(true);
    expect(comment).equals('JEFF!');
  });

  it('parses GIF with Application Extension', async () => {
    const nodeBuf = fs.readFileSync(XMP_GIF);
    const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.length);

    const parser = new GifParser(ab);
    let appId;
    let appAuthCode;
    let hasAppData = false;
    parser.onApplicationExtension(evt => {
      appId = evt.detail.applicationIdentifier
      appAuthCode = new TextDecoder().decode(
          evt.detail.applicationAuthenticationCode);
      hasAppData = evt.detail.applicationData.byteLength > 0;
    });
    
    await parser.start();
    
    expect(appId).equals("XMP Data");
    expect(appAuthCode).equals('XMP');
  });
});
