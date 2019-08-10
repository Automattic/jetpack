/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

if ( window.location.search && -1 !== window.location.search.indexOf( 'plan' ) ) {
	dispatch( 'core/notices' ).createNotice(
		'success',
		'Plan upgraded. You may use premium blocks now.'
	);
}
