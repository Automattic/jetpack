/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { siteHasFeature } from '@automattic/jetpack-script-data';
import { PanelRow } from '@wordpress/components';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { features } from '../../utils';
import { SocialPostModal } from '../social-post-modal/modal';
import { ConnectionsList } from './connections-list';
import { EmptyState } from './empty-state';
import { EnhancedFeaturesNudge } from './enhanced-features-nudge';
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

	const showSharePostForm =
		isPublicizeEnabled &&
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
			{ siteHasFeature( features.UNIFIED_UI_V1 ) ? <PreviewPostsTrigger /> : <SocialPostModal /> }
			<EnhancedFeaturesNudge />
			{ showSharePostForm && <SharePostForm analyticsData={ { location: 'editor' } } /> }
		</>
	);
}
