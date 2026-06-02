/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { PanelRow } from '@wordpress/components';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import { usePerNetworkCustomization } from '../../hooks/use-per-network-customization';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { ConnectionsList } from './connections-list';
import { EmptyState } from './empty-state';
import { PreviewPostsTrigger } from './preview-posts-trigger';
import { SharePostForm } from './share-post-form';
import { UserConnectionNotice } from './user-connection-notice';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @return {object} - Publicize form component.
 */
export default function PublicizeForm() {
	const { hasConnections, hasEnabledConnections, connections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan, needsUserConnection } =
		usePublicizeConfig();
	const { attachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();

	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;
	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ]
	);
	const perNetworkMode = usePerNetworkCustomization();

	const showSharePostForm =
		isPublicizeEnabled &&
		// We don't show the form if per-network customization is enabled
		// because the form is displayed in the preview modal
		! perNetworkMode.isEnabled &&
		! isPublicizeDisabledBySitePlan &&
		( hasEnabledConnections ||
			// We show the form if there is any attached media or validation errors to let the user
			// fix the issues with uploading an image.
			attachedMedia.length > 0 ||
			( Object.keys( validationErrors ).length !== 0 && ! isConvertible ) );

	// If there are no connections, show the empty state or user connection notice.
	if ( ! hasConnections ) {
		// User connection has priority over empty state.
		return needsUserConnection ? <UserConnectionNotice /> : <EmptyState />;
	}

	return (
		<>
			<PanelRow>
				<ConnectionsList />
			</PanelRow>
			{ needsUserConnection ? <UserConnectionNotice /> : null }
			<PreviewPostsTrigger />
			{ showSharePostForm && <SharePostForm analyticsData={ { location: 'editor' } } /> }
		</>
	);
}
