/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import '@wordpress/notices';
import { parse as parseUrl } from 'url';

/**
 * Shows a notification when a Stripe has been connected or
 * connection has been cancelled after redirection from WPCOM.
 */
if ( undefined !== typeof window && window.location ) {
	const { query } = parseUrl( window.location.href, true );

	if ( query.stripe_connect_success ) {
		dispatch( 'core/notices' ).createNotice(
			'success',
			__(
				'Congrats! Your site is now connected to Stripe. You can now start accepting funds!',
				'jetpack'
			)
		);
	} else if ( query.stripe_connect_cancelled ) {
		dispatch( 'core/notices' ).createNotice(
			'error',
			__( 'You cancelled connecting your site to Stripe.', 'jetpack' )
		);
	}
}
