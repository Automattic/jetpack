/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ClipboardIcon } from '../../lib/icons';

export default function CopyButton( { answer } ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const answerString = new DOMParser().parseFromString( answer, 'text/html' );
	const cleanAnswer = answerString.body.textContent || answerString.body.innerText || '';
	const copyRef = useCopyToClipboard( cleanAnswer, () => {
		setHasCopied( true );
		setTimeout( () => setHasCopied( false ), 3000 );
	} );

	return (
		<div className="jetpack-ai-chat-copy-button-container">
			<Button
				className="jetpack-ai-chat-copy-button"
				disabled={ hasCopied }
				label={ __( 'Copy Response', 'jetpack' ) }
				variant="has-text"
				ref={ copyRef }
			>
				<Icon className="copy-icon" icon={ ClipboardIcon } />
				{ hasCopied
					? _x( 'Copied!', 'Copied to clipboard', 'jetpack' )
					: _x( 'Copy Response', 'Copy to clipboard.', 'jetpack' ) }
			</Button>
		</div>
	);
}
