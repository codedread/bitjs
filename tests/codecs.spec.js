/*
 * codecs.spec.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2022 Google Inc.
 */

import 'mocha';
import { expect } from 'chai';
import { getFullMIMEString, getShortMIMEString } from '../codecs/codecs.js';

/**
 * @typedef {import('../codecs/codecs.js').ProbeStream} ProbeStream
 */
/**
 * @typedef {import('../codecs/codecs.js').ProbeFormat} ProbeFormat
 */
/**
 * @typedef {import('../codecs/codecs.js').ProbeInfo} ProbeInfo
 */

describe('codecs test suite', () => {

  describe('getShortMIMEString()', () => {
    it('throws when unknown', () => {
      expect(() => getShortMIMEString()).to.throw();
      expect(() => getShortMIMEString(null)).to.throw();
      expect(() => getShortMIMEString({})).to.throw();
      expect(() => getShortMIMEString({
        streams: [],
      })).to.throw();
      expect(() => getShortMIMEString({
        format: { format_name: 'mp4' },
        streams: [],
      })).to.throw();
      expect(() => getShortMIMEString({
        format: { format_name: 'invalid-video-format' },
        streams: [ { codec_type: 'video' } ],
      })).to.throw();
    });

    it('detects MP3', () => {
      expect(getShortMIMEString({
        format: { format_name: 'mp3' },
        streams: [ { codec_type: 'audio'}, { codec_type: 'video' } ],
      })).equals('audio/mpeg');
    });

    it('detects FLAC', () => {
      expect(getShortMIMEString({
        format: { format_name: 'flac', format_tag_string: 'fLaC' },
        streams: [ { codec_type: 'audio'}, { codec_type: 'video' } ],
      })).equals('audio/flac');
    });

    it('detects AVI video', () => {
      expect(getShortMIMEString({
        format: { format_name: 'avi' },
        streams: [ { codec_type: 'video' } ],
      })).equals('video/x-msvideo');
    });

    it('detects MPEG video', () => {
      expect(getShortMIMEString({
        format: { format_name: 'mpeg' },
        streams: [ { codec_type: 'video' } ],
      })).equals('video/mpeg');
    });

    it('detects MPEG audio', () => {
      expect(getShortMIMEString({
        format: { format_name: 'mpeg' },
        streams: [ { codec_type: 'audio' } ],
      })).equals('audio/mpeg');
    });

    it('detects M4A audio', () => {
      expect(getShortMIMEString({
        format: { filename: 'sample.m4a', format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
        streams: [ { codec_type: 'video', }, { codec_type: 'audio' } ],
      })).equals('audio/mp4');
    });

    it('detects MP4 video', () => {
      expect(getShortMIMEString({
        format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
        streams: [ { codec_type: 'video' } ],
      })).equals('video/mp4');
    });

    it('detects MP4 audio', () => {
      expect(getShortMIMEString({
        format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
        streams: [ { codec_type: 'audio' } ],
      })).equals('audio/mp4');
    });

    it('detects OGG video', () => {
      expect(getShortMIMEString({
        format: { format_name: 'ogg' },
        streams: [ { codec_type: 'video' } ],
      })).equals('video/ogg');
    });

    it('detects OGG audio', () => {
      expect(getShortMIMEString({
        format: { format_name: 'ogg' },
        streams: [ { codec_type: 'audio' } ],
      })).equals('audio/ogg');
    });

    it('detects WEBM video', () => {
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'video', codec_name: 'vp8' } ],
      })).equals('video/webm');
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'video', codec_name: 'vp9' } ],
      })).equals('video/webm');
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'video', codec_name: 'av1' } ],
      })).equals('video/webm');
    });

    it('detects WEBM audio', () => {
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'audio', codec_name: 'opus' } ],
      })).equals('audio/webm');
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'audio', codec_name: 'vorbis' } ],
      })).equals('audio/webm');
    });

    it('detects Matroska Video', () => {
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'video', codec_name: 'h264' } ],
      })).equals('video/x-matroska');

      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [
          { codec_type: 'audio', codec_name: 'aac' },
          { codec_type: 'video', codec_name: 'vp9' },
        ],
      })).equals('video/x-matroska');

      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [
          { codec_type: 'audio', codec_name: 'vorbis' },
          { codec_type: 'video', codec_name: 'h264' },
        ],
      })).equals('video/x-matroska');
    });

    it('detects Matroska audio', () => {
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'audio', codec_name: 'aac' } ],
      })).equals('audio/x-matroska');
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'audio', codec_name: 'dts' } ],
      })).equals('audio/x-matroska');
    });
  });

  describe('getFullMIMEString()', () => {
    it('throws when unknown', () => {
      expect(() => getFullMIMEString()).to.throw();
      expect(() => getFullMIMEString(null)).to.throw();
      expect(() => getFullMIMEString({})).to.throw();
      expect(() => getFullMIMEString({
        streams: [],
      })).to.throw();
      expect(() => getFullMIMEString({
        format: { format_name: 'invalid-video-format' },
        streams: [ { codec_type: 'video' } ],
      })).to.throw();
    });

    describe('AVC1 / H264', () => {
      /** @type {ProbeInfo} */
      let info;

      beforeEach(() => {
        info = {
          format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
          streams: [{
            codec_type: 'video',
            codec_tag_string: 'avc1',
          }],
        };
      });

      describe('Profile tests', () => {
        beforeEach(() => {
          info.streams[0].level = 20;
        });

        it('detects Constrained Baseline Profile', () => {
          info.streams[0].profile = 'Constrained Baseline';
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.4240'));
        });

        it('detects Baseline Profile', () => {
          info.streams[0].profile = 'Baseline';
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.4200'));
        });

        it('detects Extended Profile', () => {
          info.streams[0].profile = 'Extended';
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.5800'));
        });

        it('detects Main Profile', () => {
          info.streams[0].profile = 'Main';
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.4D00'));
        });

        it('detects High Profile', () => {
          info.streams[0].profile = 'High';
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.6400'));
        });
      });

      describe('Level tests', () => {
        beforeEach(() => {
          info.streams[0].profile = 'Main';
        });

        it('detects 2-digit hex level', () => {
          info.streams[0].level = 21; // 0x15
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.'))
              .and.satisfy(s => s.endsWith('15"'));
        });

        it('detects 1-digit hex level', () => {
          info.streams[0].level = 10; // 0x0A
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.'))
              .and.satisfy(s => s.endsWith('0A"'));
        });
      });

      it('Handles codec_name=h264, but no codec_tag_string', () => {
        info.streams[0].codec_name = 'h264';
        info.streams[0].profile = 'Main';
        info.streams[0].codec_tag_string = '[0][0][0][0]';
        info.streams[0].level = 20;
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.satisfy(s => s.startsWith('video/mp4; codecs="avc1.4D00'));
      });
    });
  });

  describe('WebM' ,() => {
    describe('AV1', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'video', codec_name: 'av1' }],
        };
      });

      it('outputs MIME string', () => {
        expect(getShortMIMEString(info)).equals('video/webm');
        expect(getFullMIMEString(info)).equals('video/webm; codecs="av1"')
      });
    });

    describe('VP8', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'video', codec_name: 'vp8' }],
        };
      });

      it('outputs MIME string', () => {
        expect(getShortMIMEString(info)).equals('video/webm');
        expect(getFullMIMEString(info)).equals('video/webm; codecs="vp8"')
      });
    });

    describe('VP09 / VP9', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'video', codec_name: 'vp9', codec_tag_string: 'vp09' }],
        };
      });
  
      describe('Profile tests', () => {
        beforeEach(() => {
          info.streams[0].level = 20;
        });
  
        it('detects Profile 0', () => {
          info.streams[0].profile = 'Profile 0';
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/webm; codecs="vp09.00.'));
        });
      });
  
      describe('Level tests', () => {
        beforeEach(() => {
          info.streams[0].profile = 'Profile 0';
        });
  
        it('detects 2-digit hex level', () => {
          info.streams[0].level = 21; // 0x15
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.satisfy(s => s.startsWith('video/webm; codecs="vp09.'))
              .and.satisfy(s => {
                const matches = s.match(/vp09\.[0-9]{2}\.([0-9A-F]{2})\.[0-9A-F]{2}/);
                return matches && matches.length === 2 && matches[1] === '15';
              });
          });
  
        it('detects level = -99 as level 1', () => {
          info.streams[0].level = -99; // I believe this is the "unknown" value from ffprobe.
          expect(getFullMIMEString(info))
              .to.be.a('string')
              .and.equals('video/webm; codecs="vp09.00.10.10"');
        });
      });
  
      it('detects codec_name=vp9 but no codec_tag_string', () => {
        info.streams[0].codec_name = 'vp9';
        info.streams[0].codec_tag_string = '[0][0][0][0]';
        info.streams[0].profile = 'Profile 0';
        info.streams[0].level = 21; // 0x15
        expect(getFullMIMEString(info))
        .to.be.a('string')
        .and.satisfy(s => s.startsWith('video/webm; codecs="vp09.00.15'));
      });
    });

    describe('Vorbis', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'audio', codec_name: 'vorbis' }],
        };
      });
  
      it('detects vorbis', () => {
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.equals('audio/webm; codecs="vorbis"');
      });
    });
  
    describe('Opus', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{
            codec_type: 'audio',
            codec_name: 'opus',
          }],
        };
      });
  
      it('detects opus', () => {
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.equals('audio/webm; codecs="opus"');
      });
    });  
  });

  describe('Matroska', () => {
    describe('MPEG2 codec', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'video', codec_name: 'mpeg2video' }],
        };
      });
  
      it('outputs full MIME string', () => {
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.equals('video/x-matroska; codecs="mpeg2video"');
      });
    });
  
    describe('AC-3', () => {
      /** @type {ProbeInfo} */
      let info;
  
      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'audio', codec_name: 'ac3' }],
        };
      });
  
      it('detects AC-3', () => {
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.equals('audio/x-matroska; codecs="ac-3"');
      });
    });
  
    describe('DTS', () => {
      /** @type {ProbeInfo} */
      let info;

      beforeEach(() => {
        info = {
          format: { format_name: 'matroska,webm' },
          streams: [{ codec_type: 'audio', codec_name: 'dts' }],
        };
      });
  
      it('outputs full MIME string', () => {
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.equals('audio/x-matroska; codecs="dts"');
      });
    });
  });

  describe('MP4A / AAC', () => {
    /** @type {ProbeInfo} */
    let baseInfo = {
      format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
      streams: [{
        codec_type: 'audio',
        codec_tag_string: 'mp4a',
      }],
    };

    it('throws when unknown', () => {
      expect(() => getFullMIMEString(baseInfo)).to.throw();
    });

    describe('Profile tests', () => {
      it('recognizes AAC-LC', () => {
        const info = structuredClone(baseInfo);
        info.streams[0].profile = 'LC';
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.equals('audio/mp4; codecs="mp4a.40.2"');
      });
    });

    it('recognizes codec_name=HE-AAC', () => {
      const info = structuredClone(baseInfo);
      info.streams[0].profile = 'HE-AAC';
      info.streams[0].codec_name = 'aac';
      expect(getFullMIMEString(info))
          .to.be.a('string')
          .and.equals('audio/mp4; codecs="mp4a.40.5"');
    });

    it('handles codec_name=aac but no codec_tag_string', () => {
      const info = structuredClone(baseInfo);
      info.streams[0].profile = 'LC';
      info.streams[0].codec_tag_string = '[0][0][0][0]';
      info.streams[0].codec_name = 'aac';
      expect(getFullMIMEString(info))
          .to.be.a('string')
          .and.equals('audio/mp4; codecs="mp4a.40.2"');
    });

    it('handles m4a file with MJPEG stream', () => {
      const info = structuredClone(baseInfo);
      info.format.filename = 'sample.m4a';
      info.streams[0].profile = 'LC';
      info.streams.push({codec_name: 'mjpeg', codec_type: 'video', profile: 'Baseline'});
      expect(getFullMIMEString(info))
          .to.be.a('string')
          .and.equals('audio/mp4; codecs="mp4a.40.2"');
    })
  });

  describe('MP4 / FLAC', () => {
    /** @type {ProbeInfo} */
    let info;

    beforeEach(() => {
      info = {
        format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
        streams: [{
          codec_type: 'audio',
          codec_tag_string: 'mp4a',
        }],
      };
    });

    it('audio/mp4 handles fLaC', () => {
      info.streams[0].codec_tag_string = 'fLaC';
      info.streams[0].codec_name = 'flac';
      expect(getFullMIMEString(info))
          .to.be.a('string')
          .and.equals('audio/mp4; codecs="flac"');
    });

    it('video/mp4 handles fLaC', () => {
      const vInfo = structuredClone(info);
      vInfo.streams[0].codec_tag_string = 'fLaC';
      vInfo.streams[0].codec_name = 'flac';
      vInfo.streams.push({
        codec_type: 'video',
        codec_name: 'mjpeg',
      });
      expect(getFullMIMEString(vInfo))
          .to.be.a('string')
          .and.equals('video/mp4; codecs="flac"');

    });
  });

  describe('AVI', () => {
    it('detects AVI', () => {
      /** @type {ProbeInfo} */
      let info = {
        format: { format_name: 'avi' },
        streams: [
          { codec_type: 'video', codec_name: 'mpeg4', codec_tag_string: 'XVID' },
          { codec_type: 'audio', codec_name: 'mp3' },
          { codec_type: 'audio', codec_name: 'mp3' },
        ],
      };
      expect(getShortMIMEString(info))
          .to.be.a('string')
          .and.equals('video/x-msvideo');
      expect(getFullMIMEString(info))
          .to.be.a('string')
          .and.equals('video/x-msvideo');
    });
  });

  describe('MP3', () => {
    it('detects MP3', () => {
      /** @type {ProbeInfo} */
      let info = {
        format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2' },
        streams: [ { codec_type: 'audio', codec_name: 'mp3', codec_tag_string: 'mp4a' } ],
      };
      expect(getShortMIMEString(info)).equals('audio/mp4');
      expect(getFullMIMEString(info)).equals('audio/mp4; codecs="mp3"');
    });
  });

  describe('WAV', () => {
    it('detects WAV', () => {
      /** @type {ProbeInfo} */
      let info = {
        format: { format_name: 'wav' },
        streams: [ { codec_type: 'audio', codec_name: 'pcm_s16le' } ],
      };
      expect(getShortMIMEString(info))
          .to.be.a('string')
          .and.equals('audio/wav');
      expect(getFullMIMEString(info))
          .to.be.a('string')
          .and.equals('audio/wav');
    });
  });
});
