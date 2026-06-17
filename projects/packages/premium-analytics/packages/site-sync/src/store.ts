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
	// Synchronous seed so the first route-guard read is correct before any poll runs.
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
	 * Set the initial-full-sync milestone.
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
	 * Whether the initial full sync has finished.
	 *
	 * @param state - Store state.
	 * @return Whether the initial full sync has finished.
	 */
	isInitialSyncFinished: ( state: State ): boolean => state.milestone > 0,
};

/**
 * Site-sync data store.
 *
 * Holds the initial-full-sync milestone so synchronous route guards can read it.
 * Seeded from script-data, then advanced live by the sync poll (see `useSyncStatus`).
 */
export const siteSyncStore = createReduxStore( SITE_SYNC_STORE, {
	reducer,
	actions,
	selectors,
} );

// Registered on import so guards can `select()` it before any `beforeLoad`.
// Listed in `package.json` `sideEffects` so the registration survives tree-shaking.
register( siteSyncStore );
