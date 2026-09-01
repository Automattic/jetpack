import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Get meta data from a VideoPress video.
 *
 * @param {object} video - VideoPress media object.
 * @return {Promise} A promise containing {mime: string, fileSize: number, length: number}}
 */
const getVideoPressMetadata = async video => {
	if (
		! video?.media_details?.videopress?.original ||
		! video?.media_details?.videopress?.duration
	) {
		return {};
	}

	const response = await fetch( video?.media_details?.videopress?.original, { method: 'HEAD' } );
	const contentLength = response.headers.get( 'content-length' );
	const contentType = response.headers.get( 'content-type' );

	if ( ! contentLength || ! contentType ) {
		return {};
	}

	return {
		mime: contentType,
		fileSize: contentLength,
		length: Math.round( video.media_details.videopress.duration / 1000 ),
	};
};

/**
 * Get relevant details from a WordPress media object.
 *
 * @param {object} media - WordPress media object.
 * @return {Promise} An object containing mediaData and metaData.
 */
const getMediaDetails = async media => {
	if ( ! media ) {
		return {};
	}

	let metaData = {
		mime: media.mime_type,
		fileSize: media.media_details.filesize,
		length: media.media_details?.length,
	};

	if ( media.mime_type === 'video/videopress' ) {
		metaData = await getVideoPressMetadata( media );
	}

	const sizes = media?.media_details?.sizes ?? {};

	if ( ! sizes.full ) {
		return {
			mediaData: {
				width: media.media_details.width,
				height: media.media_details.height,
				sourceUrl: media.source_url,
			},
			metaData,
		};
	}

	// We use medium image size for previews to decrease the load time.
	// But fallback to full size, if the medium size is not available.
	const previewSize = sizes.medium || sizes.large || sizes.full;
	const previewData = {
		width: previewSize.width,
		height: previewSize.height,
		sourceUrl: previewSize.source_url,
	};

	return {
		mediaData: {
			width: sizes.full.width,
			height: sizes.full.height,
			sourceUrl: sizes.full.source_url,
		},
		metaData,
		previewData,
	};
};

/**
 * Hook to handle storing the attached media.
 *
 * @param {number} mediaId - ID of the current media in the Media Lib.
 * @return {[ mediaDetails: import('./types').MediaDetails, isNotFound: boolean ]} - The media details and whether the attachment was not found
 */
export default function useMediaDetails( mediaId = null ) {
	const [ mediaDetails, setMediaDetails ] = useState( [ {} ] );

	// Returns the media object, null (resolved but not found), or undefined (still loading).
	// Same pattern as useSigPreview's getMedia callback.
	const mediaObject = useSelect(
		select => {
			if ( ! mediaId ) {
				return null;
			}
			const media = select( coreStore ).getEntityRecord( 'postType', 'attachment', mediaId, {
				context: 'view',
			} );
			if ( media ) {
				return media;
			}
			const hasResolved = select( coreStore ).hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				mediaId,
				{ context: 'view' },
			] );
			return hasResolved ? null : undefined;
		},
		[ mediaId ]
	);

	const getAsyncDetails = useCallback( async () => {
		try {
			const details = await getMediaDetails( mediaObject );
			setMediaDetails( [ details ?? {} ] );
		} catch {
			setMediaDetails( [ {} ] );
		}
	}, [ mediaObject ] );

	useEffect( () => {
		getAsyncDetails();
	}, [ getAsyncDetails ] );

	// Media was resolved but the attachment doesn't exist (deleted)
	const isNotFound = mediaObject === null && !! mediaId;

	return [ mediaDetails[ 0 ], isNotFound ];
}
