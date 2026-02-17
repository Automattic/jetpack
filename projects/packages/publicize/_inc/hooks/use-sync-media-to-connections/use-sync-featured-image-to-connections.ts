import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils/script-data';
import useFeaturedImage from '../use-featured-image';
import useMediaDetails from '../use-media-details';
import { usePerNetworkCustomization } from '../use-per-network-customization';

/**
 * Hook that syncs the featured image URL to connections with media_source === 'featured-image'.
 *
 * When per-network customization is enabled and the featured image changes,
 * this hook updates the attached_media field for all connections using featured image.
 * Only runs when the site has social paid features.
 */
export function useSyncFeaturedImageToConnections() {
	const { isEnabled: isPerNetworkEnabled } = usePerNetworkCustomization();
	const { customizeConnectionById } = useDispatch( socialStore );

	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	// Get featured image details
	const featuredImageId = useFeaturedImage();
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );
	const featuredImageUrl = featuredImageDetails?.mediaData?.sourceUrl;
	const featuredImageMime = featuredImageDetails?.metaData?.mime ?? 'image/jpeg';

	useEffect( () => {
		if (
			! hasSocialPaidFeatures() ||
			! isPerNetworkEnabled ||
			! featuredImageUrl ||
			! featuredImageId
		) {
			return;
		}

		connections.forEach( connection => {
			if ( connection.media_source !== 'featured-image' ) {
				return;
			}

			const currentUrl = connection.attached_media?.[ 0 ]?.url;

			if ( currentUrl !== featuredImageUrl ) {
				customizeConnectionById(
					connection.connection_id,
					{
						attached_media: [
							{ id: featuredImageId, url: featuredImageUrl, type: featuredImageMime },
						],
					},
					true
				);
			}
		} );
	}, [
		isPerNetworkEnabled,
		featuredImageId,
		featuredImageUrl,
		featuredImageMime,
		connections,
		customizeConnectionById,
	] );
}
