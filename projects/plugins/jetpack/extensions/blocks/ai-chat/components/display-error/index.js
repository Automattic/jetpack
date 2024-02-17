import { __ } from '@wordpress/i18n';

export default function DisplayError() {
	return (
		<div className="jetpack-ai-chat-error-container">
			{ __( 'There was an error while generating the answer. Please try again later.', 'jetpack' ) }
		</div>
	);
}
