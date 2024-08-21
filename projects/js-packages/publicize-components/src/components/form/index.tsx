/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { Disabled, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { usePublicizeConfig } from '../../..';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { SocialPostModal } from '../social-post-modal/modal';
import { ConnectionNotice } from './connection-notice';
import { ConnectionsList } from './connections-list';
import { EnhancedFeaturesNudge } from './enhanced-features-nudge';
import { SharePostForm } from './share-post-form';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @return {object} - Publicize form component.
 */
export default function PublicizeForm() {
	const { hasConnections, hasEnabledConnections, connections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan } = usePublicizeConfig();
	const { attachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();

	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;
	const { isConvertible } = useMediaRestrictions( connections, useMediaDetails( mediaId )[ 0 ] );

	const showSharePostForm =
		isPublicizeEnabled && ( hasEnabledConnections || attachedMedia.length > 0 || ! isConvertible );

	const { useAdminUiV1, featureFlags } = useSelect( select => {
		const store = select( socialStore );
		return {
			useAdminUiV1: store.useAdminUiV1(),
			featureFlags: store.featureFlags(),
		};
	}, [] );

	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	return (
		<Wrapper>
			{
				// Render modal only once
				useAdminUiV1 ? <ManageConnectionsModal /> : null
			}
			{ hasConnections ? (
				<>
					<PanelRow>
						<ConnectionsList />
					</PanelRow>
					{ featureFlags.useEditorPreview && isPublicizeEnabled ? <SocialPostModal /> : null }
					<EnhancedFeaturesNudge />
				</>
			) : null }
			<ConnectionNotice />

			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					{ showSharePostForm && <SharePostForm analyticsData={ { location: 'editor' } } /> }
				</Fragment>
			) }
		</Wrapper>
	);
}
