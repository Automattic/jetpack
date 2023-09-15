import { __ } from '@wordpress/i18n';

export default function DisplayError( { error } ) {
	return (
		<div className="jetpack-ai-chat-error-container">
			{ __( 'Sorry, there was an error: ', 'jetpack' ) }
			{ error.message }
		</div>
	);
}
