import {
	DASHBOARD_PREFERENCES_SCOPE,
	getPromosForPlacement,
	isPromoDismissed,
	pickPromo,
	type Promo,
	type PromoDismissal,
	type PromoPlacement,
} from '@jetpack-premium-analytics/data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useSyncExternalStore } from 'react';

const PREFERENCES_KEY = 'dismissedPromos';

type DismissedPromos = Record< string, PromoDismissal >;

type PreferencesActions = {
	set: ( scope: string, key: string, value: DismissedPromos ) => Promise< void > | void;
};

const EMPTY: DismissedPromos = {};

// Keyed by placement, not slug: marking the closed promo dismissed would make the picker return the next one under the reader's cursor. The next load picks it instead.
const closedPlacements = new Set< PromoPlacement >();
const listeners = new Set< () => void >();

const subscribe = ( listener: () => void ) => {
	listeners.add( listener );
	return () => listeners.delete( listener );
};

/**
 * Forget the placements closed this load. Test-only.
 */
export function resetPromoDismissalForTesting() {
	closedPlacements.clear();
	listeners.forEach( listener => listener() );
}

const useIsPlacementClosed = ( placement: PromoPlacement ) =>
	useSyncExternalStore( subscribe, () => closedPlacements.has( placement ) );

const useStoredDismissals = (): DismissedPromos =>
	useSelect( select => {
		const value = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, key: string ) => unknown;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY );

		return value && typeof value === 'object' && ! Array.isArray( value )
			? ( value as DismissedPromos )
			: EMPTY;
	}, [] );

/**
 * The promo a placement should mount, if any.
 *
 * @param placement - Where the promo renders.
 * @param target    - The section a `section-footer` promo attaches to.
 * @return The promo, or null when none is registered, all are dismissed, or one was closed this load.
 */
export function usePromoSlot( placement: PromoPlacement, target?: string ): Promo | null {
	const isClosed = useIsPlacementClosed( placement );
	const dismissed = useStoredDismissals();

	if ( isClosed ) {
		return null;
	}

	return pickPromo( getPromosForPlacement( placement, target ), dismissed, Date.now() );
}

/**
 * One promo's dismissal state. A first close snoozes it, a second is final.
 *
 * @param promo - The promo the card shows.
 * @return Whether it is hidden, how often it was closed before, and how to close it.
 */
export function usePromoDismissal( promo: Promo ): {
	isDismissed: boolean;
	closeCount: number;
	dismiss: () => void;
} {
	const { slug, placement, snooze_days: snoozeDays } = promo;
	const isClosed = useIsPlacementClosed( placement );
	const dismissed = useStoredDismissals();
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const dismiss = useCallback( () => {
		closedPlacements.add( placement );
		listeners.forEach( listener => listener() );
		void set( DASHBOARD_PREFERENCES_SCOPE, PREFERENCES_KEY, {
			...dismissed,
			[ slug ]: { count: ( dismissed[ slug ]?.count ?? 0 ) + 1, at: new Date().toISOString() },
		} );
	}, [ placement, slug, dismissed, set ] );

	return {
		isDismissed: isClosed || isPromoDismissed( dismissed[ slug ], snoozeDays, Date.now() ),
		closeCount: dismissed[ slug ]?.count ?? 0,
		dismiss,
	};
}
