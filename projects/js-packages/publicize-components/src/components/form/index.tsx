/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { Disabled, PanelRow } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { usePublicizeConfig } from '../../..';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { getSocialScriptData } from '../../utils/script-data';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { SocialPostModal } from '../social-post-modal/modal';
import { ConnectionNotice } from './connection-notice';
import { ConnectionsList } from './connections-list';
import { ShareCountInfo } from './share-count-info';
import { SharePostForm } from './share-post-form';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @returns {object} - Publicize form component.
 */
export default function PublicizeForm() {
	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan } = usePublicizeConfig();

	const { useAdminUiV1 } = getSocialScriptData().feature_flags;

	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	const { feature_flags } = getSocialScriptData();

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
					{ feature_flags.useEditorPreview && isPublicizeEnabled ? <SocialPostModal /> : null }
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
