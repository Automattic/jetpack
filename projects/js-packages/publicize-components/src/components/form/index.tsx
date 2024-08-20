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
import { usePublicizeConfig } from '../../..';
import useAttachedMedia from '../../hooks/use-attached-media';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { SocialPostModal } from '../social-post-modal/modal';
import { ConnectionNotice } from './connection-notice';
import { ConnectionsList } from './connections-list';
import { ShareCountInfo } from './share-count-info';
import { SharePostForm } from './share-post-form';

const findPostMedia = content => {
	const parser = new DOMParser();
	const doc = parser.parseFromString( content, 'text/html' );
	const imgElements = Array.from( doc.querySelectorAll( 'img' ) );

	if ( imgElements.length === 0 ) {
		return null;
	}

	const imgElement = imgElements[ 0 ];
	const classNames = imgElement.className.split( ' ' );
	const imageClass = classNames.find( className => className.startsWith( 'wp-image-' ) );
	if ( imageClass ) {
		const mediaId = parseInt( imageClass.replace( 'wp-image-', '' ) );
		const mediaUrl = imgElement?.src;
		return { mediaId, mediaUrl };
	}
};

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @returns {object} - Publicize form component.
 */
export default function PublicizeForm() {
	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan } = usePublicizeConfig();

	const { getEditedPostContent } = useSelect( editorStore, [] );
	const { retrievedMedia, updateRetrievedMedia } = useAttachedMedia();

	const postMedia = findPostMedia( getEditedPostContent() );
	if ( retrievedMedia?.id !== postMedia?.mediaId ) {
		updateRetrievedMedia( { id: postMedia?.mediaId, url: postMedia?.mediaUrl } );
	}

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
					<ShareCountInfo />
				</>
			) : null }
			<ConnectionNotice />

			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					{ isPublicizeEnabled && hasEnabledConnections && (
						<SharePostForm analyticsData={ { location: 'editor' } } />
					) }
				</Fragment>
			) }
		</Wrapper>
	);
}
