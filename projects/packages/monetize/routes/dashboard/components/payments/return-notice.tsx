import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useState } from 'react';

/**
 * What the Stripe return added to the URL, read once and then removed so a reload doesn't repeat it.
 *
 * @return `connected`, `cancelled`, or null.
 */
export function takeStripeReturn(): 'connected' | 'cancelled' | null {
	const url = new URL( window.location.href );
	const result = url.searchParams.has( 'stripe_connect_success' )
		? 'connected'
		: url.searchParams.has( 'stripe_connect_cancelled' ) && 'cancelled';
	if ( ! result ) {
		return null;
	}

	url.searchParams.delete( 'stripe_connect_success' );
	url.searchParams.delete( 'stripe_connect_cancelled' );
	window.history.replaceState( window.history.state, '', url );
	return result;
}

/**
 * Reports how the trip to Stripe ended, after WordPress.com sends the user back here.
 *
 * @return The notice, or nothing.
 */
export default function ReturnNotice() {
	const [ result ] = useState( takeStripeReturn );

	if ( result === 'connected' ) {
		return (
			<Notice.Root intent="success">
				<Notice.Description>
					{ __( 'Congrats! Your site is now connected to Stripe.', 'jetpack-monetize' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( result === 'cancelled' ) {
		return (
			<Notice.Root intent="info">
				<Notice.Description>
					{ __(
						'The attempt to connect to Stripe was cancelled. You can connect again at any time.',
						'jetpack-monetize'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	return null;
}
