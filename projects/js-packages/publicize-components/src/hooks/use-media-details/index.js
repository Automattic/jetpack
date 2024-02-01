import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Get meta data from a VideoPress video.
 *
 * @param {object} video - VideoPress media object.
 * @returns {Promise} A promise containing {mime: string, fileSize: number, length: number}}
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
 * @returns {Promise} An object containing mediaData and metaData.
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
	const previewSize = sizes.medium || sizes.large;
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
 * @returns {[ mediaDetails: {metaData: {mime: string, fileSize: number, length: number}, mediaData: {width: number, height: number, sourceUrl: string}} ]} - The media details
 */
export default function useMediaDetails( mediaId = null ) {
	const [ mediaDetails, setMediaDetails ] = useState( [ {} ] );

	const mediaObject = useSelect(
		select => select( 'core' ).getMedia( mediaId, { context: 'view' } ),
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

	return mediaDetails;
}
