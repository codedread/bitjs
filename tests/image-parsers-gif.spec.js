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
    parser.addEventListener('logical_screen', evt => {
      const {logicalScreenWidth, logicalScreenHeight} = evt.logicalScreen;
      expect(logicalScreenWidth).equals(32);
      expect(logicalScreenHeight).equals(52);
    });
    parser.addEventListener('table_based_image', evt => {
      const {imageWidth, imageHeight} = evt.tableBasedImage;
      expect(imageWidth).equals(32);
      expect(imageHeight).equals(52);
    });
    parser.addEventListener('comment_extension', evt => comment = evt.comment);
    parser.addEventListener('trailer', evt => trailerFound = true);
    
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
    parser.addEventListener('application_extension', evt => {
      appId = evt.applicationExtension.applicationIdentifier
      appAuthCode = new TextDecoder().decode(
          evt.applicationExtension.applicationAuthenticationCode);
      hasAppData = evt.applicationExtension.applicationData.byteLength > 0;
    });
    
    await parser.start();
    
    expect(appId).equals("XMP Data");
    expect(appAuthCode).equals('XMP');
  });
});
