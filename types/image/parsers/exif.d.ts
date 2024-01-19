/**
 * @param {ByteStream} stream
 * @param {ByteStream} lookAheadStream
 * @param {boolean} debug
 * @returns {ExifValue}
 */
export function getExifValue(stream: ByteStream, lookAheadStream: ByteStream, DEBUG?: boolean): ExifValue;
/**
 * Reads the entire EXIF profile. The first 2 bytes in the stream must be the TIFF marker (II/MM).
 * @param {ByteStream} stream
 * @returns {Map<number, ExifValue} A map of all EXIF values found. The key is the EXIF tag number.
 */
export function getExifProfile(stream: ByteStream): Map<number, ExifValue>;
export type ExifTagNumber = number;
export namespace ExifTagNumber {
    const IMAGE_DESCRIPTION: number;
    const MAKE: number;
    const MODEL: number;
    const ORIENTATION: number;
    const X_RESOLUTION: number;
    const Y_RESOLUTION: number;
    const RESOLUTION_UNIT: number;
    const SOFTWARE: number;
    const DATE_TIME: number;
    const WHITE_POINT: number;
    const PRIMARY_CHROMATICITIES: number;
    const Y_CB_CR_COEFFICIENTS: number;
    const Y_CB_CR_POSITIONING: number;
    const REFERENCE_BLACK_WHITE: number;
    const COPYRIGHT: number;
    const EXIF_OFFSET: number;
    const EXPOSURE_TIME: number;
    const F_NUMBER: number;
    const EXPOSURE_PROGRAM: number;
    const ISO_SPEED_RATINGS: number;
    const EXIF_VERSION: number;
    const DATE_TIME_ORIGINAL: number;
    const DATE_TIME_DIGITIZED: number;
    const COMPONENT_CONFIGURATION: number;
    const COMPRESSED_BITS_PER_PIXEL: number;
    const SHUTTER_SPEED_VALUE: number;
    const APERTURE_VALUE: number;
    const BRIGHTNESS_VALUE: number;
    const EXPOSURE_BIAS_VALUE: number;
    const MAX_APERTURE_VALUE: number;
    const SUBJECT_DISTANCE: number;
    const METERING_MODE: number;
    const LIGHT_SOURCE: number;
    const FLASH: number;
    const FOCAL_LENGTH: number;
    const MAKER_NOTE: number;
    const USER_COMMENT: number;
    const FLASH_PIX_VERSION: number;
    const COLOR_SPACE: number;
    const EXIF_IMAGE_WIDTH: number;
    const EXIF_IMAGE_HEIGHT: number;
    const RELATED_SOUND_FILE: number;
    const EXIF_INTEROPERABILITY_OFFSET: number;
    const FOCAL_PLANE_X_RESOLUTION: number;
    const FOCAL_PLANE_Y_RESOLUTION: number;
    const FOCAL_PLANE_RESOLUTION_UNIT: number;
    const SENSING_METHOD: number;
    const FILE_SOURCE: number;
    const SCENE_TYPE: number;
    const IMAGE_WIDTH: number;
    const IMAGE_LENGTH: number;
    const BITS_PER_SAMPLE: number;
    const COMPRESSION: number;
    const PHOTOMETRIC_INTERPRETATION: number;
    const STRIP_OFFSETS: number;
    const SAMPLES_PER_PIXEL: number;
    const ROWS_PER_STRIP: number;
    const STRIP_BYTE_COUNTS: number;
    const PLANAR_CONFIGURATION: number;
    const JPEG_IF_OFFSET: number;
    const JPEG_IF_BYTE_COUNT: number;
    const Y_CB_CR_SUB_SAMPLING: number;
}
export type ExifDataFormat = number;
export namespace ExifDataFormat {
    const UNSIGNED_BYTE: number;
    const ASCII_STRING: number;
    const UNSIGNED_SHORT: number;
    const UNSIGNED_LONG: number;
    const UNSIGNED_RATIONAL: number;
    const SIGNED_BYTE: number;
    const UNDEFINED: number;
    const SIGNED_SHORT: number;
    const SIGNED_LONG: number;
    const SIGNED_RATIONAL: number;
    const SINGLE_FLOAT: number;
    const DOUBLE_FLOAT: number;
}
export type ExifValue = {
    /**
     * The numerical value of the tag.
     */
    tagNumber: ExifTagNumber;
    /**
     * A string representing the tag number.
     */
    tagName?: string | undefined;
    /**
     * The data format.
     */
    dataFormat: ExifDataFormat;
    /**
     * Populated for SIGNED/UNSIGNED BYTE/SHORT/LONG/FLOAT.
     */
    numericalValue?: number | undefined;
    /**
     * Populated only for ASCII_STRING.
     */
    stringValue?: string | undefined;
    /**
     * Populated only for SIGNED/UNSIGNED RATIONAL.
     */
    numeratorValue?: number | undefined;
    /**
     * Populated only for SIGNED/UNSIGNED RATIONAL.
     */
    denominatorValue?: number | undefined;
    /**
     * Populated only for UNDEFINED data format.
     */
    numComponents?: number | undefined;
    /**
     * Populated only for UNDEFINED data format.
     */
    offsetValue?: number | undefined;
};
import { ByteStream } from "../../io/bytestream.js";
//# sourceMappingURL=exif.d.ts.map