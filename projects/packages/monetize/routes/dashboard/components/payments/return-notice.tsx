import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { useMembershipProducts } from '../../data/memberships';
import { getPaymentsState } from './state';

const PARAMS = [ 'stripe_connect_success', 'stripe_connect_cancelled' ];

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
	if ( search.has( PARAMS[ 0 ] ) ) {
		return 'connected';
	}
	return search.has( PARAMS[ 1 ] ) ? 'cancelled' : null;
}

/**
 * The page URL without the Stripe return, so a reload or tab switch doesn't repeat the notice.
 *
 * @param href - The page URL.
 * @return The rest.
 */
export function withoutStripeReturn( href: string ): string {
	const url = new URL( href );
	PARAMS.forEach( param => url.searchParams.delete( param ) );
	return url.toString();
}

/**
 * Reports how the trip to Stripe ended, after WordPress.com sends the user back here.
 *
 * @return The notice, or nothing.
 */
export default function ReturnNotice() {
	const [ result ] = useState( () => readStripeReturn( window.location.href ) );
	const { canManagePlans } = getPaymentsState();
	const { data: products } = useMembershipProducts();
	// The plans card opens its add dialog from this hash.
	const openAddPlan = useCallback( () => {
		window.location.hash = 'add-new-payment-plan';
	}, [] );

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
				{ canManagePlans && products?.length === 0 && (
					<Notice.Actions>
						<Notice.ActionButton onClick={ openAddPlan }>
							{ __( 'Add a payment plan', 'jetpack-monetize' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				) }
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
