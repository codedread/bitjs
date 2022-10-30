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
        streams: [ { codec_type: 'video' } ],
      })).equals('video/webm');
    });

    it('detects WEBM audio', () => {
      expect(getShortMIMEString({
        format: { format_name: 'matroska,webm' },
        streams: [ { codec_type: 'audio' } ],
      })).equals('audio/webm');
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

    describe('AVC1', () => {
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
    });
  });

  describe('VP09', () => {
    /** @type {ProbeInfo} */
    let info;

    beforeEach(() => {
      info = {
        format: { format_name: 'matroska,webm' },
        streams: [{
          codec_type: 'video',
          codec_tag_string: 'vp09',
        }],
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

      it('detects level = -99', () => {
        info.streams[0].level = -99; // I'm not sure what ffprobe means by this.
        expect(getFullMIMEString(info))
            .to.be.a('string')
            .and.satisfy(s => s.startsWith('video/webm; codecs="vp09.'))
            .and.satisfy(s => {
              const matches = s.match(/vp09\.[0-9]{2}\.([0-9A-F]{2})\.[0-9A-F]{2}/);
              return matches && matches.length === 2 && matches[1] === 'FF';
            });
      });
    });
  });
});
