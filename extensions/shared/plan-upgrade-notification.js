/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import '@wordpress/notices';
import { parse as parseUrl } from 'url';

/**
 * Shows a notification when a plan is marked as purchased
 * after redirection from WPCOM.
 */

if ( undefined !== typeof window && window.location ) {
	const { query } = parseUrl( window.location.href, true );

	if ( query.plan_upgraded ) {
		dispatch( 'core/notices' ).createNotice(
			'success',
			__( 'Plan upgraded. You may use premium blocks now.', 'jetpack' )
		);
	}
}
