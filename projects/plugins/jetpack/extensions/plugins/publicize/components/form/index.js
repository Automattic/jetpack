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

	function isDisabled() {
		const dissabled = connections.every( connection => ! connection.toggleable );
		return dissabled;
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
