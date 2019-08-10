/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

if ( window.location.search && -1 !== window.location.search.indexOf( 'plan' ) ) {
	dispatch( 'core/notices' ).createNotice(
		'success',
		__( 'Plan upgraded. You may use premium blocks now.', 'jetpack' )
	);
}
