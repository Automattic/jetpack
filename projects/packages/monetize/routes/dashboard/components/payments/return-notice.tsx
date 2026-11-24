import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useEffect, useState } from 'react';

const SUCCESS = 'stripe_connect_success';
const CANCELLED = 'stripe_connect_cancelled';

/**
 * How the trip to Stripe ended, from the params WordPress.com adds to the admin URL.
 *
 * They sit beside `p`, not inside it, so the router never sees them.
 *
 * @param href - The page URL.
 * @return `connected`, `cancelled`, or null.
 */
export function readStripeReturn( href: string ): 'connected' | 'cancelled' | null {
	const search = new URL( href ).searchParams;
	if ( search.has( SUCCESS ) ) {
		return 'connected';
	}
	return search.has( CANCELLED ) ? 'cancelled' : null;
}

/**
 * The page URL without the Stripe return, so a reload or tab switch doesn't repeat the notice.
 *
 * @param href - The page URL.
 * @return The rest.
 */
export function withoutStripeReturn( href: string ): string {
	const url = new URL( href );
	[ SUCCESS, CANCELLED ].forEach( param => url.searchParams.delete( param ) );
	return url.toString();
}

/**
 * Reports how the trip to Stripe ended, after WordPress.com sends the user back here.
 *
 * @return The notice, or nothing.
 */
export default function ReturnNotice() {
	const [ result ] = useState( () => readStripeReturn( window.location.href ) );

	useEffect( () => {
		if ( result ) {
			window.history.replaceState(
				window.history.state,
				'',
				withoutStripeReturn( window.location.href )
			);
		}
	}, [ result ] );

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
