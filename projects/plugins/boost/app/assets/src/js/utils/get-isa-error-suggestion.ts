import { __ } from '@wordpress/i18n';

export default function getIsaErrorSuggestion( code ) {
	let suggestion = '';

	if ( 429 === code ) {
		suggestion = __( 'Minimum time between requests is 1 hour.', 'jetpack-boost' );
	}

	return suggestion;
}
