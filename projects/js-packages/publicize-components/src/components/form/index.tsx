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
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { AdvancedPlanNudge } from './advanced-plan-nudge';
import { BrokenConnectionsNotice } from './broken-connections-notice';
import { ConnectionsList } from './connections-list';
import { MediaValidationNotices } from './media-validation-notices';
import { SettingsButton } from './settings-button';
import { ShareCountInfo } from './share-count-info';
import { SharePostForm } from './share-post-form';
import styles from './styles.module.scss';
import { UnsupportedConnectionsNotice } from './unsupported-connections-notice';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @returns {object} - Publicize form component.
 */
export default function PublicizeForm() {
	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const {
		isPublicizeEnabled,
		isPublicizeDisabledBySitePlan,
		needsUserConnection,
		userConnectionUrl,
	} = usePublicizeConfig();

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
					<ShareCountInfo />
					<BrokenConnectionsNotice />
					<UnsupportedConnectionsNotice />
					{ featureFlags.useEditorPreview ? <p>New modal trigger goes here</p> : null }
					<MediaValidationNotices />
				</>
			) : null }
			<PanelRow>
				{
					// Use IIFE make it more readable and avoid nested ternary operators.
					( () => {
						if ( needsUserConnection ) {
							return (
								<p>
									{ __(
										'You must connect your WordPress.com account to be able to add social media connections.',
										'jetpack'
									) }
									&nbsp;
									<a href={ userConnectionUrl }>{ __( 'Connect now', 'jetpack' ) }</a>
								</p>
							);
						}

						if ( ! hasConnections ) {
							return (
								<p>
									<span className={ styles[ 'no-connections-text' ] }>
										{ __(
											'Sharing is disabled because there are no social media accounts connected.',
											'jetpack'
										) }
									</span>
									<SettingsButton label={ __( 'Connect an account', 'jetpack' ) } />
								</p>
							);
						}

						return null;
					} )()
				}
			</PanelRow>

			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					{ isPublicizeEnabled && hasEnabledConnections && <SharePostForm /> }
					<AdvancedPlanNudge />
				</Fragment>
			) }
		</Wrapper>
	);
}
