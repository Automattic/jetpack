/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

/**
 * Internal dependencies
 */
import PublicizeConnection from '../connection';
import PublicizeSettingsButton from '../settings-button';
import MessageBox from '../message-box';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSelectSocialMedia from '../../hooks/use-select-social-media';

export default function PublicizeForm( { refreshCallback } ) {
	const { connections, message, maxLength } = useSelectSocialMedia();
	const { toggleEnableState, updateMessage } = useSocialMediaConnections();

	/**
	 * Check to see if form should be disabled.
	 *
	 * Checks full connection list to determine if all are disabled.
	 * If they all are, it returns true to disable whole form.
	 *
	 * @returns {boolean} True if whole form should be disabled.
	 */
	function isDisabled() {
		return connections.every( connection => ! connection.toggleable );
	}

	return (
		<div id="publicize-form">
			<ul className="jetpack-publicize__connections-list">
				{ connections.map( ( { display_name, enabled, id, service_name, toggleable } ) => (
					<PublicizeConnection
						disabled={ ! toggleable }
						enabled={ enabled }
						key={ id }
						id={ id }
						label={ display_name }
						name={ service_name }
						toggleConnection={ toggleEnableState }
					/>
				) ) }
			</ul>

			<PublicizeSettingsButton refreshCallback={ refreshCallback } />

			{ connections.some( connection => connection.enabled ) && (
				<MessageBox
					disabled={ isDisabled() }
					maxLength={ maxLength }
					onChange={ updateMessage }
					message={ message }
				/>
			) }
		</div>
	);
}
