/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { PanelRow, TextareaControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';

export default function MessageBoxControl() {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const { connections } = useSocialMediaConnections();

	function isDisabled() {
		return connections.every( connection => ! connection.toggleable );
	}

	const charactersRemaining = maxLength - message.length;

	return (
		<PanelRow>
			<TextareaControl
				className="publicize-message-box-control"
				value={ message }
				onChange={ updateMessage }
				disabled={ isDisabled }
				maxLength={ maxLength }
				placeholder={ __(
					"Write a message for your audience here. If you leave this blank, we'll use an excerpt of the post content as the message.",
					'jetpack'
				) }
				rows={ 4 }
				help={ sprintf(
					/* translators: placeholder is a number. */
					_n( '%d character remaining', '%d characters remaining', charactersRemaining, 'jetpack' ),
					charactersRemaining
				) }
			/>
		</PanelRow>
	);
}
