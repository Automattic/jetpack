import { useEffect, useState } from '@wordpress/element';
import { fetchSubscribersTotals } from './api';
import type { SubscribersTotals } from './types';

const defaultTotals: SubscribersTotals = {
	total_subscribers: 0,
	email_subscribers: 0,
	paid_subscribers: 0,
	social_followers: 0,
};

type State = {
	data: SubscribersTotals;
	isLoading: boolean;
	error: string | null;
};

/**
 * Subscriber totals hook (total / email / paid / social).
 *
 * Phase 2 keeps this on plain `useState`/`useEffect`; React Query lands in Phase 4.
 *
 * @return Loading state, totals, and error string.
 */
export function useSubscribersTotals(): State {
	const [ state, setState ] = useState< State >( {
		data: defaultTotals,
		isLoading: true,
		error: null,
	} );

	useEffect( () => {
		let cancelled = false;

		fetchSubscribersTotals()
			.then( response => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: response.counts ?? defaultTotals,
					isLoading: false,
					error: null,
				} );
			} )
			.catch( ( err: Error ) => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: defaultTotals,
					isLoading: false,
					error: err?.message ?? 'Failed to fetch subscriber totals',
				} );
			} );

		return () => {
			cancelled = true;
		};
	}, [] );

	return state;
}
