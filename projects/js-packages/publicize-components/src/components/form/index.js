/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

import { Connection as PublicizeConnection } from '@automattic/jetpack-publicize-components';
import { PanelRow, Disabled } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import MessageBoxControl from '../message-box-control';
import PublicizeSettingsButton from '../settings-button';
import styles from './styles.module.scss';

/**
 * The Publicize form component. It contains the connection list, and the message box.
 *
 * @param {object} props                                - The component props.
 * @param {boolean} props.isPublicizeEnabled            - Whether Publicize is enabled for this post.
 * @param {boolean} props.isRePublicizeFeatureEnabled   - True if the RePublicize feature is available.
 * @param {boolean} props.isPublicizeDisabledBySitePlan - A combination of the republicize feature being enabled and/or the post not being published.
 * @returns {object}                                    - Publicize form component.
 */
export default function PublicizeForm( {
	isPublicizeEnabled,
	isRePublicizeFeatureEnabled,
	isPublicizeDisabledBySitePlan,
} ) {
	const { connections, toggleById, hasConnections } = useSocialMediaConnections();
	const { message, updateMessage, maxLength } = useSocialMediaMessage();

	const isDisabled = () =>
		! isRePublicizeFeatureEnabled && connections.every( connection => ! connection.toggleable );
	const Wrapper = isPublicizeDisabledBySitePlan ? Disabled : Fragment;

	return (
		<Wrapper>
			{ hasConnections && (
				<PanelRow>
					<ul className={ styles[ 'connections-list' ] }>
						{ connections.map(
							( { display_name, enabled, id, service_name, toggleable, profile_picture } ) => (
								<PublicizeConnection
									disabled={ isRePublicizeFeatureEnabled ? ! isPublicizeEnabled : ! toggleable }
									enabled={ enabled && ! isPublicizeDisabledBySitePlan }
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
