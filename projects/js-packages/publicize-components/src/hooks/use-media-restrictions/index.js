import { useRef, useMemo } from '@wordpress/element';
import {
	DEFAULT_RESTRICTIONS,
	GLOBAL_MAX_SIZE,
	PHOTON_CONVERTIBLE_TYPES,
	RESTRICTIONS,
} from './restrictions';

export const NO_MEDIA_ERROR = 'NO_MEDIA_ERROR';
export const FILE_TYPE_ERROR = 'FILE_TYPE_ERROR';
export const FILE_SIZE_ERROR = 'FILE_SIZE_ERROR';
export const VIDEO_LENGTH_TOO_LONG_ERROR = 'VIDEO_LENGTH_TOO_LONG_ERROR';
export const VIDEO_LENGTH_TOO_SHORT_ERROR = 'VIDEO_LENGTH_TOO_SHORT_ERROR';
export const DIMENSION_ERROR = 'DIMENSION_ERROR';

/**
 * Checks whether a media is a video.
 *
 * @param {string} mime - The MIME tye of the media
 * @returns {boolean} Whether it is a video.
 */
export function isVideo( mime ) {
	return mime.split( '/' )[ 0 ] === 'video';
}

/**
 * Checks whether a media is convertible so we can convert it if needed.
 *
 * @param {object} metaData - Media metadata, mime, fileSize and length.
 * @returns {boolean} Whether it is convertible.
 */
const isMediaConvertible = metaData => {
	if ( ! metaData?.mime || ! metaData?.fileSize ) {
		return false;
	}

	const { mime, fileSize } = metaData;
	if ( isVideo( mime ) ) {
		return false;
	}

	if ( ! PHOTON_CONVERTIBLE_TYPES.includes( mime ) ) {
		return false;
	}

	const sizeInMb = fileSize ? fileSize / Math.pow( 1000, 2 ) : null;

	if ( sizeInMb >= 55 ) {
		return false;
	}

	return true;
};

/**
 * This function is used to check if the provided image is valid based on it's size and type.
 *
 * @param {number} sizeInMb - The fileSize in bytes.
 * @param {number} width - Width of the image.
 * @param {number} height - Height of the image.
 * @param {object} imageLimits - Has the properties to check against
 * @returns {FILE_SIZE_ERROR} Returns validation error.
 */
const getImageValidationError = ( sizeInMb, width, height, imageLimits ) => {
	const {
		maxSize = GLOBAL_MAX_SIZE,
		minWidth = 0,
		maxWidth = GLOBAL_MAX_SIZE,
		aspectRatio = DEFAULT_RESTRICTIONS.image.aspectRatio,
	} = imageLimits;

	const ratio = width / height;
	if (
		ratio < aspectRatio.min ||
		ratio > aspectRatio.max ||
		width > maxWidth ||
		width < minWidth
	) {
		return DIMENSION_ERROR;
	}

	return ! sizeInMb || sizeInMb > maxSize ? FILE_SIZE_ERROR : null;
};

/**
 * This function is used to check if the provided video is valid based on it's size and type and length.
 *
 * @param {number} sizeInMb - The fileSize in bytes.
 * @param {number} length - Video length in seconds and.
 * @param {number} width - Width of the video.
 * @param {number} height - Height of the video.
 * @param {object} videoLimits - Has the properties to check against
 * @returns {(FILE_SIZE_ERROR | VIDEO_LENGTH_TOO_LONG_ERROR | VIDEO_LENGTH_TOO_SHORT_ERROR)} Returns validation error.
 */
const getVideoValidationError = ( sizeInMb, length, width, height, videoLimits ) => {
	const {
		minSize = 0,
		maxSize = GLOBAL_MAX_SIZE,
		minLength = 0,
		maxLength = GLOBAL_MAX_SIZE,
		maxWidth = GLOBAL_MAX_SIZE,
		aspectRatio = DEFAULT_RESTRICTIONS.video.aspectRatio,
	} = videoLimits;

	if ( ! sizeInMb || sizeInMb > maxSize || sizeInMb < minSize ) {
		return FILE_SIZE_ERROR;
	}

	if ( ! length || length < minLength ) {
		return VIDEO_LENGTH_TOO_SHORT_ERROR;
	}

	if ( length > maxLength ) {
		return VIDEO_LENGTH_TOO_LONG_ERROR;
	}

	const ratio = width / height;
	if ( ratio < aspectRatio.min || ratio > aspectRatio.max || width > maxWidth ) {
		return DIMENSION_ERROR;
	}

	return null;
};

/**
 * Checks whether the media with the provided metaData is valid. It can validate images or videos.
 *
 * @param {object} metaData - Media metadata, mime, fileSize and length.
 * @param {object} mediaData - Data for media, width, height, source_url etc.
 * @param {string} serviceName - The name of the social media service we want to validate against. facebook, tumblr etc.
 * @param {boolean} shouldUploadAttachedMedia - Whether the social post is set to have the media attached, the 'Share as social post' option.
 * @returns {(FILE_SIZE_ERROR | FILE_TYPE_ERROR | VIDEO_LENGTH_TOO_SHORT_ERROR | VIDEO_LENGTH_TOO_LONG_ERROR)} Returns validation error.
 */
const getValidationError = ( metaData, mediaData, serviceName, shouldUploadAttachedMedia ) => {
	const restrictions = RESTRICTIONS[ serviceName ] ?? DEFAULT_RESTRICTIONS;

	if ( ! metaData || Object.keys( metaData ).length === 0 ) {
		return restrictions.requiresMedia ? NO_MEDIA_ERROR : null;
	}

	if ( ! restrictions.requiresMedia && ! shouldUploadAttachedMedia ) {
		return null;
	}

	const { mime, fileSize } = metaData;

	if ( ! ( mime && restrictions.allowedMediaTypes.includes( mime.toLowerCase() ) ) ) {
		return FILE_TYPE_ERROR;
	}

	if ( ! mediaData?.width || ! mediaData?.height ) {
		return DIMENSION_ERROR;
	}

	const sizeInMb = fileSize ? fileSize / Math.pow( 1000, 2 ) : null;

	return isVideo( mime )
		? getVideoValidationError(
				sizeInMb,
				metaData.length,
				mediaData.width,
				mediaData.height,
				restrictions.video
		  )
		: getImageValidationError( sizeInMb, mediaData.width, mediaData.height, restrictions.image );
};

/**
 * Hooks to deal with the media restrictions
 *
 * @param {object} connections - Currently enabled connections.
 * @param {object} media - Currently enabled connections.
 * @param { { isSocialImageGeneratorEnabledForPost: boolean, shouldUploadAttachedMedia: boolean } } options - Flags for the current state. If SIG is enabled, then we assume it's valid.
 * @returns {object} Social media connection handler.
 */
const useMediaRestrictions = (
	connections,
	media,
	{ isSocialImageGeneratorEnabledForPost, shouldUploadAttachedMedia }
) => {
	const errors = useRef( {} );

	return useMemo( () => {
		const newErrors = isSocialImageGeneratorEnabledForPost
			? {}
			: connections.reduce( ( errs, { connection_id, service_name } ) => {
					const error = getValidationError(
						media.metaData,
						media.mediaData,
						service_name,
						shouldUploadAttachedMedia
					);
					if ( error ) {
						errs[ connection_id ] = error;
					}
					return errs;
			  }, {} );

		if ( JSON.stringify( newErrors ) !== JSON.stringify( errors.current ) ) {
			errors.current = newErrors;
		}
		return {
			validationErrors: errors.current,
			isConvertible: isMediaConvertible( media.metaData ),
		};
	}, [
		isSocialImageGeneratorEnabledForPost,
		connections,
		media.metaData,
		media.mediaData,
		shouldUploadAttachedMedia,
	] );
};

export default useMediaRestrictions;
