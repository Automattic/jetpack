/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { Connection as PublicizeConnection } from '@automattic/jetpack-publicize-components';
import { PanelRow, Disabled, ExternalLink } from '@wordpress/components';
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { _n, sprintf, __ } from '@wordpress/i18n';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import MessageBoxControl from '../message-box-control';
import Notice from '../notice';
import PublicizeSettingsButton from '../settings-button';
import styles from './styles.module.scss';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @param {object} props                                - The component props.
 * @param {boolean} props.isPublicizeEnabled            - Whether Publicize is enabled for this post.
 * @param {boolean} props.isRePublicizeFeatureEnabled   - True if the RePublicize feature is available.
 * @param {boolean} props.isPublicizeDisabledBySitePlan - A combination of the republicize feature being enabled and/or the post not being published.
 * @param {number} props.numberOfSharesRemaining        - The number of shares remaining for the current period. Optional.
 * @param {string} props.connectionsAdminUrl               - URL to the Admin connections page
 * @returns {object}                                    - Publicize form component.
 */
export default function PublicizeForm( {
	isPublicizeEnabled,
	isRePublicizeFeatureEnabled,
	isPublicizeDisabledBySitePlan,
	numberOfSharesRemaining = null,
	connectionsAdminUrl,
} ) {
	const {
		connections,
		toggleById,
		hasConnections,
		enabledConnections,
		refresh,
	} = useSocialMediaConnections();
	const { message, updateMessage, maxLength } = useSocialMediaMessage();

	const isDisabled = () =>
		! isRePublicizeFeatureEnabled && connections.every( connection => ! connection.toggleable );
	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	const hasBrokenConnection = connections.some( connection => ! connection.is_healthy );

	const outOfConnections =
		numberOfSharesRemaining !== null && numberOfSharesRemaining <= enabledConnections.length;

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	return (
		<Wrapper>
			{ hasConnections && (
				<>
					{ ! isDisabled() && numberOfSharesRemaining !== null && (
						<PanelRow>
							<Notice type={ numberOfSharesRemaining < connections.length ? 'warning' : 'default' }>
								{ createInterpolateElement(
									sprintf(
										/* translators: %d is the number of shares remaining, upgradeLink is the link to upgrade to a different plan */
										_n(
											'You have %d share remaining. <upgradeLink>Upgrade</upgradeLink> to share to all your social media accounts.',
											'You have %d shares remaining. <upgradeLink>Upgrade</upgradeLink> to share to all your social media accounts.',
											numberOfSharesRemaining,
											'jetpack'
										),
										numberOfSharesRemaining
									),
									{
										upgradeLink: (
											<ExternalLink
												href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor' ) }
											/>
										),
									}
								) }
							</Notice>
						</PanelRow>
					) }
					{ hasBrokenConnection && (
						<Notice type={ 'error' }>
							{ createInterpolateElement(
								__(
									'Some of your social connections are broken! Reconnect them on the <fixLink>connection management</fixLink> page.',
									'jetpack'
								),
								{
									fixLink: <ExternalLink href={ connectionsAdminUrl } />,
								}
							) }
						</Notice>
					) }
					<PanelRow>
						<ul className={ styles[ 'connections-list' ] }>
							{ connections.map(
								( {
									display_name,
									enabled,
									id,
									service_name,
									toggleable,
									profile_picture,
									is_healthy,
								} ) => (
									<PublicizeConnection
										disabled={
											( isRePublicizeFeatureEnabled ? ! isPublicizeEnabled : ! toggleable ) ||
											( ! enabled && toggleable && outOfConnections ) ||
											! is_healthy
										}
										enabled={ enabled && ! isPublicizeDisabledBySitePlan && is_healthy }
										key={ id }
										id={ id }
										label={ display_name }
										name={ service_name }
										toggleConnection={ toggleById }
										profilePicture={ profile_picture }
									/>
								)
							) }
						</ul>
					</PanelRow>
				</>
			) }

			{ ! isPublicizeDisabledBySitePlan && (
				<Fragment>
					<PublicizeSettingsButton />

					{ isPublicizeEnabled && connections.some( connection => connection.enabled ) && (
						<MessageBoxControl
							disabled={ isDisabled() }
							maxLength={ maxLength }
							onChange={ updateMessage }
							message={ message }
						/>
					) }
				</Fragment>
			) }
		</Wrapper>
	);
}
