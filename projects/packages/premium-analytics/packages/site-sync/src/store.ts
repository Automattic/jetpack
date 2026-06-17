/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { createReduxStore, register } from '@wordpress/data';

/**
 * Store name for the analytics site-sync state.
 */
export const SITE_SYNC_STORE = 'jetpack-premium-analytics/site-sync';

type State = {
	/** Initial-full-sync milestone (unix ts), or 0 if it never finished. */
	milestone: number;
};

type SetMilestoneAction = {
	type: 'SET_MILESTONE';
	value: number;
};

const DEFAULT_STATE: State = {
	// getScriptData() reads the inline script-data already present on the page,
	// so this synchronous seed is correct on first load — before any poll runs
	// and before the first route guard reads the store.
	milestone: getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0,
};

const reducer = ( state: State = DEFAULT_STATE, action: SetMilestoneAction ): State => {
	if ( action.type === 'SET_MILESTONE' ) {
		return { ...state, milestone: action.value };
	}
	return state;
};

const actions = {
	/**
	 * Set the initial-full-sync milestone. The sole writer (`useSyncStatus`)
	 * advances it monotonically via `Math.max`, so in practice the value only
	 * ever grows; the reducer itself stays a plain setter.
	 *
	 * @param value - Milestone (unix ts).
	 * @return Action object.
	 */
	setMilestone: ( value: number ): SetMilestoneAction => ( { type: 'SET_MILESTONE', value } ),
};

const selectors = {
	/**
	 * Get the initial-full-sync milestone.
	 *
	 * @param state - Store state.
	 * @return Milestone (unix ts), or 0 if the initial sync never finished.
	 */
	getMilestone: ( state: State ): number => state.milestone,
	/**
	 * Whether the initial full sync has finished — the fact the route guards
	 * gate on.
	 *
	 * @param state - Store state.
	 * @return Whether the initial full sync has finished.
	 */
	isInitialSyncFinished: ( state: State ): boolean => state.milestone > 0,
};

/**
 * Site-sync data store.
 *
 * Holds the initial-full-sync milestone so synchronous route guards can answer
 * "has the initial sync finished?" without a full-page reload. Seeded from the
 * page-load script-data snapshot at registration, then advanced live by the
 * sync poll (see `useSyncStatus`).
 */
export const siteSyncStore = createReduxStore( SITE_SYNC_STORE, {
	reducer,
	actions,
	selectors,
} );

// Registered as a side-effect of importing this module: route guards that
// `select( siteSyncStore )` import it transitively, so the store always exists
// before any `beforeLoad` runs. `package.json` lists this file in `sideEffects`
// so the registration is not tree-shaken away.
register( siteSyncStore );
