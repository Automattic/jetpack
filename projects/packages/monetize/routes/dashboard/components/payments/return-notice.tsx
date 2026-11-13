import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Notice } from '@wordpress/ui';
import { useEffect, useState } from 'react';

type Search = Record< string, unknown >;

/**
 * How the trip to Stripe ended, from the params WordPress.com adds to the URL.
 *
 * @param search - The search params.
 * @return `connected`, `cancelled`, or null.
 */
export function readStripeReturn( search: Search ): 'connected' | 'cancelled' | null {
	if ( 'stripe_connect_success' in search ) {
		return 'connected';
	}
	return 'stripe_connect_cancelled' in search ? 'cancelled' : null;
}

/**
 * The search params without the Stripe return, so a reload doesn't repeat the notice.
 *
 * @param search - The search params.
 * @return The rest.
 */
export function withoutStripeReturn( search: Search ): Search {
	const rest = { ...search };
	delete rest.stripe_connect_success;
	delete rest.stripe_connect_cancelled;
	return rest;
}

/**
 * Reports how the trip to Stripe ended, after WordPress.com sends the user back here.
 *
 * @return The notice, or nothing.
 */
export default function ReturnNotice() {
	const search: Search = useSearch( { from: '/' as never, strict: false } );
	const [ result ] = useState( () => readStripeReturn( search ) );
	const navigate = useNavigate();

	useEffect( () => {
		if ( result ) {
			navigate( { search: withoutStripeReturn, replace: true } as Parameters<
				typeof navigate
			>[ 0 ] );
		}
	}, [ navigate, result ] );

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
