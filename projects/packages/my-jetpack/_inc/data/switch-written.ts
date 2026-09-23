import apiFetch from '@wordpress/api-fetch';

// The routes that switch a feature (a module, a plugin, or several at once), all POST-only.
const SWITCH_PATHS = [
	/^\/jetpack\/v4\/module\/[^/?]+\/active\b/,
	/^\/wpcom\/v2\/my-jetpack\/site\/features\/(plugin|bulk)\b/,
];

const listeners = new Set< () => void >();
let registered = false;

/**
 * Be told the moment a feature switch has been written on the server.
 *
 * Fires on the write's own response, ahead of the reads that follow it (a module switch
 * reloads the whole module list before its caller hears back).
 *
 * @param listener - Called after each successful switch write.
 * @return The unsubscribe function.
 */
export function onSwitchWritten( listener: () => void ): () => void {
	if ( ! registered ) {
		registered = true;

		apiFetch.use( ( options, next ) => {
			const result = next( options );
			if ( SWITCH_PATHS.some( path => path.test( options.path ?? '' ) ) ) {
				result.then(
					() => listeners.forEach( notify => notify() ),
					() => {}
				);
			}

			return result;
		} );
	}

	listeners.add( listener );

	return () => {
		listeners.delete( listener );
	};
}
