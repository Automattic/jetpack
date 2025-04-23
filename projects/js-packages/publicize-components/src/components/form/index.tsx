/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { Disabled, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { getSocialScriptData } from '../../utils/script-data';
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
	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ]
	);

	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const showSharePostForm =
		isPublicizeEnabled &&
		( hasEnabledConnections ||
			// We show the form if there is any attached media or validation errors to let the user
			// fix the issues with uploading an image.
			attachedMedia.length > 0 ||
			( Object.keys( validationErrors ).length !== 0 && ! isConvertible ) );

	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	const { feature_flags } = getSocialScriptData();

	return (
		<Wrapper>
			{
				// Render modal only once
				feature_flags.useAdminUiV1 ? <ManageConnectionsModal /> : null
			}
			{ hasConnections ? (
				<>
					<PanelRow>
						<ConnectionsList />
					</PanelRow>
					{ feature_flags.useEditorPreview && isPublicizeEnabled && ! isPostPublished ? (
						<SocialPostModal />
					) : null }
					<EnhancedFeaturesNudge />
				</>
			) : null }
			<ConnectionNotice />

			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					{ showSharePostForm && <SharePostForm analyticsData={ { location: 'editor' } } /> }
				</Fragment>
			) }
			{ isPostPublished ? <SocialPostModal /> : null }
		</Wrapper>
	);
}
