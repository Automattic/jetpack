import { __ } from '@wordpress/i18n';

export default function getIsaErrorSuggestion( code ) {
	let suggestion = '';

	if ( 429 === code ) {
		suggestion = __( 'You have sent too many requests, please try later.', 'jetpack-boost' );
	}

	return suggestion;
}
