import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from 'react';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useMediaDetails from '../../../hooks/use-media-details';
import { computeAttachedMediaForSource } from '../../../hooks/use-per-network-customization/utils';
import { usePostMeta } from '../../../hooks/use-post-meta';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { SharePostForm, SharePostFormProps } from '../../form/share-post-form';

type PerNetworkCustomizationFormProps = {
	connection: Connection;
};

/**
 * Per-Network Customization Form component.
 *
 * @param {PerNetworkCustomizationFormProps} props - The component props.
 * @return - Per-Network Customization Form component.
 */
export function PerNetworkCustomizationForm( { connection }: PerNetworkCustomizationFormProps ) {
	const { customizeConnectionById } = useDispatch( socialStore );
	const {
		attachedMedia: globalAttachedMedia,
		shareMessage: globalMessage,
		mediaSource: globalMediaSource,
	} = usePostMeta();

	// Get featured image details for forced attachment
	const featuredImageId = useFeaturedImage();
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );
	const featuredImageUrl = featuredImageDetails?.mediaData?.sourceUrl;
	const featuredImageMime = featuredImageDetails?.metaData?.mime ?? 'image/jpeg';

	const message = connection.message ?? globalMessage ?? '';

	// Don't default to 'none' - let undefined trigger featured image fallback detection
	const mediaSource = connection.media_source ?? globalMediaSource;

	// Compute attached media with forced attachment logic
	// Per-network mode forces attachment, so we need to populate attached_media appropriately
	const attachedMedia = useMemo( () => {
		// If connection has explicit attached_media, use it
		if ( connection.attached_media && connection.attached_media.length > 0 ) {
			return connection.attached_media;
		}

		// Otherwise, compute based on effective media source (like syncConnections does)
		return (
			computeAttachedMediaForSource( {
				mediaSource,
				globalAttachedMedia,
				featuredImageId,
				featuredImageUrl,
				featuredImageMime,
			} ) ?? []
		);
	}, [
		connection.attached_media,
		mediaSource,
		featuredImageId,
		featuredImageUrl,
		featuredImageMime,
		globalAttachedMedia,
	] );

	// Handler for message changes
	const handleMessageChange = useCallback(
		( msg: string ) => {
			customizeConnectionById( connection.connection_id, { message: msg } );
		},
		[ connection.connection_id, customizeConnectionById ]
	);

	// Handler for media changes
	// Per-network mode forces attachment, so when media is cleared (Remove button),
	// we reset to featured image (if available) or nothing
	const handleMediaChange = useCallback< SharePostFormProps[ 'onMediaChange' ] >(
		updates => {
			let attachedMediaToStore = updates.attached_media;
			let mediaSourceToStore = updates.media_source;

			// When clearing media (Remove button), reset to featured image or nothing
			// Don't use SIG as fallback - SIG is an explicit selection, not a default
			const isClearing =
				( ! updates.attached_media || updates.attached_media.length === 0 ) &&
				updates.media_source === undefined;

			if ( isClearing ) {
				// Reset to featured image if available, otherwise no media
				if ( featuredImageId && featuredImageUrl ) {
					attachedMediaToStore = [
						{ id: featuredImageId, url: featuredImageUrl, type: featuredImageMime },
					];
					mediaSourceToStore = 'featured-image';
				} else {
					// No featured image - explicitly set 'none' to prevent fallback to global
					attachedMediaToStore = undefined;
					mediaSourceToStore = 'none';
				}
			}

			customizeConnectionById( connection.connection_id, {
				attached_media: attachedMediaToStore,
				media_source: mediaSourceToStore,
			} );
		},
		[
			connection.connection_id,
			customizeConnectionById,
			featuredImageId,
			featuredImageUrl,
			featuredImageMime,
		]
	);

	return (
		<SharePostForm
			analyticsData={ { location: 'preview-modal' } }
			isInsideNavigatorModal
			disabled={ ! connection.enabled }
			message={ message }
			onMessageChange={ handleMessageChange }
			attachedMedia={ attachedMedia }
			onMediaChange={ handleMediaChange }
			mediaSource={ mediaSource }
			forceMediaAsAttachment
		/>
	);
}
