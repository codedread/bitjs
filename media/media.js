console.warn(`This is not even an alpha-level API. Do not use.`);

// A Container Format is a file that embeds multiple data streams into a single file.
// Examples:
//   - the ZIP family (ZIP, JAR, CBZ, EPUB, ODF, OOXML)
//   - the ISO-BMFF family (MP4, HEVC, HEIC, AVIF, MOV/QT, etc)
//   - the Matroska family (MKV, WebM)
//   - the RIFF family (WAV, AVI, WebP)
//   - the OGG family (OGV, OPUS)

// The ZIP container needs special processing to determine what files are present inside it :(
// The ISO-BMFF container needs special processing because of its "compatible brands" array :(
// The Matroska container needs special processing because the sub-type can appear anywhere :(
// The OGG container needs special processing to determine what kind of streams are present :(

/**
 * @readonly
 * @enum {number}
 */
export const ContainerType = {
  UNKNOWN: 0,
  ZIP: 1,
  ISOBMFF: 100,
  MATROSKA: 101,
  RIFF: 102,
  OGG: 103,
};

/**
 * @param {ArrayBuffer} ab
 * @returns {ContainerType}
 */
export function getContainerType(ab) {
  return ContainerType.UNKNOWN;
}
