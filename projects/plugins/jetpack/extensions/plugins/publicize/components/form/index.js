/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PublicizeConnection from '../connection';
import PublicizeSettingsButton from '../settings-button';
import MessageBoxControl from '../message-box-control';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

export default function PublicizeForm() {
	const { connections, toggleById } = useSocialMediaConnections();
	const { message, updateMessage, maxLength } = useSocialMediaMessage();

	function isDisabled() {
		return connections.every( connection => ! connection.toggleable );
	}

	return (
		<Fragment>
			<PanelRow>
				<ul className="jetpack-publicize__connections-list">
					{ connections.map( ( { display_name, enabled, id, service_name, toggleable } ) => (
						<PublicizeConnection
							disabled={ ! toggleable }
							enabled={ enabled }
							key={ id }
							id={ id }
							label={ display_name }
							name={ service_name }
							toggleConnection={ toggleById }
						/>
					) ) }
				</ul>
			</PanelRow>

			<PublicizeSettingsButton />

			{ connections.some( connection => connection.enabled ) && (
				<MessageBoxControl
					disabled={ isDisabled() }
					maxLength={ maxLength }
					onChange={ updateMessage }
					message={ message }
				/>
			) }
		</Fragment>
	);
}
