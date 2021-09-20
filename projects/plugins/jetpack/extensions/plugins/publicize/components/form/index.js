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
import MessageBoxControl from '../message-box-control';
import useSocialMediaActions from '../../hooks/use-social-media-actions';
import {
	useSelectSocialMediaConnections,
	useSelectSocialMediaMessageMaxLength,
	useSelectSocialMediaMessage,
} from '../../hooks/use-select-social-media';

export default function PublicizeForm( { refreshCallback } ) {
	const connections = useSelectSocialMediaConnections();
	const message = useSelectSocialMediaMessage();
	const maxLength = useSelectSocialMediaMessageMaxLength();

	const { toggleEnableState, updateMessage } = useSocialMediaActions();

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
				<MessageBoxControl
					disabled={ isDisabled() }
					maxLength={ maxLength }
					onChange={ updateMessage }
					message={ message }
				/>
			) }
		</div>
	);
}
