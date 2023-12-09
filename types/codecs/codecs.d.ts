/**
 * TODO: Reconcile this with file/sniffer.js findMimeType() which does signature matching.
 * @param {ProbeInfo} info
 * @returns {string}
 */
export function getShortMIMEString(info: ProbeInfo): string;
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
export function getFullMIMEString(info: ProbeInfo): string;
/**
 * ffprobe -show_streams -print_format json. Only the fields we care about.
 */
export type ProbeStream = {
    index: number;
    codec_name: string;
    codec_long_name: string;
    profile: string;
    /**
     * Either 'audio' or 'video'.
     */
    codec_type: string;
    codec_tag_string: string;
    id: string;
    level: number | null;
    width: number | null;
    height: number | null;
    /**
     * Like "60000/1001"
     */
    r_frame_rate: string;
};
/**
 * Only the fields we care about from the following command:
 *     ffprobe -show_format -show_streams -v quiet -print_format json -i file.mp4
 */
export type ProbeFormat = {
    filename: string;
    format_name: string;
    /**
     * Number of seconds, as a string like "473.506367".
     */
    duration: string;
    /**
     * Number of bytes, as a string.
     */
    size: string;
    /**
     * Bit rate, as a string.
     */
    bit_rate: string;
};
/**
 * ffprobe -show_format -show_streams -print_format json
 */
export type ProbeInfo = {
    streams: ProbeStream[];
    format: ProbeFormat;
};
//# sourceMappingURL=codecs.d.ts.map