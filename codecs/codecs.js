/*
 * codecs.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2022 Google Inc.
 */

/**
 * This module helps interpret ffprobe -print_format json output.
 * Its coverage is pretty sparse right now, so send me pull requests!
 */

/**
 * @typedef ProbeStream ffprobe -show_streams -print_format json. Only the fields we care about.
 * @property {number} index
 * @property {string} codec_name
 * @property {string} codec_long_name
 * @property {string} profile
 * @property {string} codec_type Either 'audio' or 'video'.
 * @property {string} codec_tag_string
 * @property {string} id
 * @property {number?} level
 * @property {number?} width
 * @property {number?} height
 * @property {string} r_frame_rate Like "60000/1001"
 */

/**
 * @typedef ProbeFormat Only the fields we care about from the following command:
 *     ffprobe -show_format -show_streams -v quiet -print_format json -i file.mp4
 * @property {string} filename
 * @property {string} format_name
 * @property {string} duration Number of seconds, as a string like "473.506367".
 * @property {string} size Number of bytes, as a string.
 * @property {string} bit_rate Bit rate, as a string.
 */

/**
 * @typedef ProbeInfo ffprobe -show_format -show_streams -print_format json
 * @property {ProbeStream[]} streams
 * @property {ProbeFormat} format
 */

/**
 * Maps the ffprobe format.format_name string to a short MIME type.
 * @type {Object<string, string>}
 */
const FORMAT_NAME_TO_SHORT_TYPE = {
  'avi': 'video/x-msvideo',
  'flac': 'audio/flac',
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
}

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#webm says that only
// the following codecs are supported for webm:
// - video: AV1, VP8, VP9
// - audio: Opus, Vorbis
const WEBM_AUDIO_CODECS = [ 'opus', 'vorbis' ];
const WEBM_VIDEO_CODECS = [ 'av1', 'vp8', 'vp9' ];

/**
 * TODO: Reconcile this with file/sniffer.js findMimeType() which does signature matching.
 * @param {ProbeInfo} info
 * @returns {string}
 */
export function getShortMIMEString(info) {
  if (!info) throw `Invalid ProbeInfo`;
  if (!info.streams || info.streams.length === 0) throw `No streams in ProbeInfo`;

  const formatName = info?.format?.format_name;
  if (formatName && Object.keys(FORMAT_NAME_TO_SHORT_TYPE).includes(formatName)) {
    return FORMAT_NAME_TO_SHORT_TYPE[formatName];
  }

  // M4A files are specifically audio/mp4.
  if (info?.format?.filename?.toLowerCase().endsWith('.m4a')) {
    return 'audio/mp4';
  }

  // Otherwise, any file with at least 1 video stream is considered video/.
  // Otherwise, any file with at least 1 audio stream is considered audio/.
  const type = info.streams.some(s => s.codec_type === 'video') ?
      'video' :
      info.streams.some(s => s.codec_type === 'audio') ? 'audio' : undefined;
  if (!type) {
    throw `Cannot handle media file type (no video/audio streams for ${info.format.format_name}). ` +
        `Please file a bug https://github.com/codedread/bitjs/issues/new`;
  }

  /** @type {string} */
  let subType;
  switch (formatName) {
    case 'mpeg':
      subType = 'mpeg';
      break;
    case 'mov,mp4,m4a,3gp,3g2,mj2':
      subType = 'mp4';
      break;
    case 'ogg':
      subType = 'ogg';
      break;
    case 'matroska,webm':
      let isWebM = true;
      for (const stream of info.streams) {
        if (   (stream.codec_type === 'audio' && !WEBM_AUDIO_CODECS.includes(stream.codec_name))
            || (stream.codec_type === 'video' && !WEBM_VIDEO_CODECS.includes(stream.codec_name))) {
              isWebM = false;
          break;
        }
      }
      subType = isWebM ? 'webm' : 'x-matroska';
      break;
    default:
      throw `Cannot handle format ${formatName} yet. ` +
          `Please file a bug https://github.com/codedread/bitjs/issues/new`;
  }

  return `${type}/${subType}`;
}

/**
 * Accepts the ffprobe JSON output and returns an ISO MIME string with parameters (RFC6381), such
 * as 'video/mp4; codecs="avc1.4D4028, mp4a.40.2"'. This string should be suitable to be used on
 * the server as the Content-Type header of a media stream which can subsequently be used on the
 * client as the type value of a SourceBuffer object `mediaSource.addSourceBuffer(contentType)`.
 * NOTE: For now, this method fails hard (throws an error) when it encounters a format/codec it
 *     does not recognize. Please file a bug or send a PR.
 * @param {ProbeInfo} info
 * @returns {string}
 */
export function getFullMIMEString(info) {
  /** A string like 'video/mp4' */
  let contentType = `${getShortMIMEString(info)}`;
  if (Object.values(FORMAT_NAME_TO_SHORT_TYPE).includes(contentType)) {
    return contentType;
  }

  let codecFrags = new Set();

  for (const stream of info.streams) {
    if (stream.codec_type === 'audio') {
      // MP3 can sometimes have codec_tag_string=mp4a, so we check for it first.
      if (stream.codec_name === 'mp3') {
        codecFrags.add('mp3');
        continue;
      }

      switch (stream.codec_tag_string) {
        case 'mp4a': codecFrags.add(getMP4ACodecString(stream)); break;
        default: 
          switch (stream.codec_name) {
            case 'aac': codecFrags.add(getMP4ACodecString(stream)); break;
            // I'm going off of what Chromium calls this one, with the dash.
            case 'ac3': codecFrags.add('ac-3'); break;
            case 'dts': codecFrags.add('dts'); break;
            case 'flac': codecFrags.add('flac'); break;
            case 'opus': codecFrags.add('opus'); break;
            case 'vorbis': codecFrags.add('vorbis'); break;
            default:
              throw `Could not handle audio codec_name ${stream.codec_name}, ` +
                    `codec_tag_string ${stream.codec_tag_string} for file ${info.format.filename} yet. ` +
                    `Please file a bug https://github.com/codedread/bitjs/issues/new`;
          }
          break;
      }
    }
    else if (stream.codec_type === 'video') {
      switch (stream.codec_tag_string) {
        case 'avc1': codecFrags.add(getAVC1CodecString(stream)); break;
        case 'vp09': codecFrags.add(getVP09CodecString(stream)); break;
        // We don't handle these as video streams with codecs, so skip them.
        case 'png': continue;
        default:
          switch (stream.codec_name) {
            case 'av1': codecFrags.add('av1'); break;
            case 'h264': codecFrags.add(getAVC1CodecString(stream)); break;
            // Skip mjpeg as a video stream for the codecs string.
            case 'mjpeg': break;
            case 'mpeg2video': codecFrags.add('mpeg2video'); break;
            case 'vp8': codecFrags.add('vp8'); break;
            case 'vp9': codecFrags.add(getVP09CodecString(stream)); break;
            default:
              throw `Could not handle video codec_name ${stream.codec_name}, ` +
                    `codec_tag_string ${stream.codec_tag_string} for file ${info.format.filename} yet. ` +
                    `Please file a bug https://github.com/codedread/bitjs/issues/new`;

          }
      }
    }
  }

  if (codecFrags.size === 0) return contentType;
  return contentType + '; codecs="' + Array.from(codecFrags).join(',') + '"';
}

// TODO: Consider whether any of these should be exported.

/**
 * AVC1 is the same thing as H264.
 * https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#iso_base_media_file_format_mp4_quicktime_and_3gp
 * @param {ProbeStream} stream
 * @returns {string}
 */
function getAVC1CodecString(stream) {
  if (!stream.profile) throw `No profile found in AVC1 stream`;

  let frag = 'avc1';

  // Add PP and CC hex digits.
  switch (stream.profile) {
    case 'Constrained Baseline':
      frag += '.4240';
      break;
    case 'Baseline':
      frag += '.4200';
      break;
    case 'Extended':
      frag += '.5800';
      break;
    case 'Main':
      frag += '.4D00';
      break;
    case 'High':
      frag += '.6400';
      break;
    default:
      throw `Cannot handle AVC1 stream with profile ${stream.profile} yet. ` +
          `Please file a bug https://github.com/codedread/bitjs/issues/new`;
  }

  // Add LL hex digits.
  const levelAsHex = Number(stream.level).toString(16).toUpperCase().padStart(2, '0');
  if (levelAsHex.length !== 2) {
    throw `Cannot handle AVC1 level ${stream.level} yet. ` +
        `Please file a bug https://github.com/codedread/bitjs/issues/new`;
  }
  frag += levelAsHex;

  return frag;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#webm
 * @param {ProbeStream} stream
 * @returns {string}
 */
function getVP09CodecString(stream) {
  // TODO: Consider just returning 'vp9' here instead since I have so much guesswork.
  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#webm

  // The ISO format is cccc.PP.LL.DD
  let frag = 'vp09';

  // Add PP hex digits.
  switch (stream.profile) {
    case 'Profile 0':
      frag += '.00';
      break;
    case 'Profile 1':
      frag += '.01';
      break;
    case 'Profile 2':
      frag += '.02';
      break;
    case 'Profile 3':
      frag += '.03';
      break;
    default:
      throw `Cannot handle VP09 stream with profile ${stream.profile} yet. ` +
          `Please file a bug https://github.com/codedread/bitjs/issues/new`;
  }

  // Add LL hex digits.
  // If ffprobe is spitting out -99 as level... it means unknown, so we will guess level=1.
  if (stream.level === -99) { frag += `.10`; }
  else {
    const levelAsHex = Number(stream.level).toString(16).toUpperCase().padStart(2, '0');
    if (levelAsHex.length !== 2) {
      throw `Cannot handle VP09 level ${stream.level} yet. ` + 
          `Please file a bug https://github.com/codedread/bitjs/issues/new`;
    }
    frag += `.${levelAsHex}`;
  }

  // Add DD hex digits.
  // TODO: This is just a guess at DD (10-bit color depth), need to try and extract this info
  //     from ffprobe JSON output instead.
  frag += '.10';

  return frag;
}

/**
 * MP4A is the same as AAC.
 * https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#mp4a
 * @param {ProbeStream} stream
 * @returns {string}
 */
function getMP4ACodecString(stream) {
  let frag = 'mp4a.40';
  // https://dashif.org/codecs/audio/
  switch (stream.profile) {
    case 'LC':
      frag += '.2';
      break;
    case 'HE-AAC':
      frag += '.5';
      break;
    // TODO: more!
    default:
      throw `Cannot handle AAC stream with profile ${stream.profile} yet. ` +
          `Please file a bug https://github.com/codedread/bitjs/issues/new`;
  }
  return frag;
}
