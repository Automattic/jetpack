import { useSelect } from '@wordpress/data';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions/constants';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';

/**
 * Returns whether sharing is possible based on the current media and connections.
 *
 * Returns true if at least one of the enabled connections is valid for sharing, false otherwise.
 *
 * @return {boolean} Whether sharing is possible.
 */
export function useIsSharingPossible() {
	const { enabledConnections } = useSocialMediaConnections();
	const { attachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();

	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;
	const { validationErrors, isConvertible } = useMediaRestrictions(
		enabledConnections,
		useMediaDetails( mediaId )[ 0 ]
	);

	const brokenConnectionIds = useSelect( select => {
		return select( socialStore )
			.getBrokenConnections()
			.map( c => c.connection_id );
	}, [] );

	// Sharing will be possible if any of the enabled connections are valid for sharing.
	return enabledConnections.some( function isValidForSharing( { connection_id, service_name } ) {
		// Return early if the connection is broken
		if ( brokenConnectionIds.includes( connection_id ) ) {
			return false;
		}

		// Return early if the connection is not in the validation errors
		if ( ! ( connection_id in validationErrors ) ) {
			return true;
		}

		// We need some media for Instagram
		if (
			service_name === 'instagram-business' &&
			Object.values( validationErrors ).includes( NO_MEDIA_ERROR )
		) {
			return false;
		}

		// Media won't be shared if it's not convertible
		return isConvertible;
	} );
}
