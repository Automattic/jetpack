/**
 * Local `keyedReducer` higher-order reducer.
 *
 * `@wordpress/notices` >= 5.45.0 imports `keyedReducer` from `@wordpress/data`,
 * which only added this export in `@wordpress/data` 10.45.0 (Gutenberg
 * consolidated copies previously maintained inside notices and core-data;
 * see WordPress/gutenberg#77364). The polyfill externalizes `@wordpress/data`
 * to the runtime `window.wp.data` global so notices state stays in the shared
 * registry. On sites that still ship an older `@wordpress/data` (current
 * WordPress Core), `window.wp.data.keyedReducer` is `undefined` and the
 * polyfill bundle throws at load time.
 *
 * To keep `@wordpress/data` externalized for every other symbol (so the store
 * registers in the shared registry) while staying robust to the missing
 * helper, we ship a local copy and alias only the file that needs it.
 * Implementation kept byte-identical to upstream.
 *
 * @see https://github.com/WordPress/gutenberg/pull/77364
 */

/**
 * Returns a higher-order reducer that maintains a sub-state keyed by
 * `action[ actionProperty ]`. The wrapped reducer runs against the slice of
 * state belonging to that key.
 *
 * @param {string} actionProperty - Action key whose value selects the sub-state.
 * @return {Function} Higher-order reducer factory.
 */
export const keyedReducer =
	actionProperty =>
	reducer =>
	( state = {}, action ) => {
		const key = action[ actionProperty ];
		if ( key === undefined ) {
			return state;
		}
		const nextKeyState = reducer( state[ key ], action );
		if ( nextKeyState === state[ key ] ) {
			return state;
		}
		return {
			...state,
			[ key ]: nextKeyState,
		};
	};
