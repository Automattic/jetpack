/*
 * TanStack Router, bundled in core's @wordpress/route, drops the promises of the view transitions
 * it starts, so a skipped one throws "Transition was skipped": https://github.com/TanStack/router/issues/8776
 * @todo On each WordPress version bump, check whether core's router-core has that fix; if so, remove this.
 */

let activeTransition = null;

/**
 * Keep view transitions from erroring when one navigation's transition cuts off another's.
 *
 * Boot animates every route change, and a document runs one transition at a time, so two
 * navigations close together, from one app or two, skip the first one.
 */
export function trackViewTransitions() {
	if ( typeof document.startViewTransition !== 'function' ) {
		return;
	}
	const start = document.startViewTransition.bind( document );
	document.startViewTransition = ( ...args ) => {
		const transition = start( ...args );
		for ( const promise of [
			transition.ready,
			transition.finished,
			transition.updateCallbackDone,
		] ) {
			promise?.catch( () => {} );
		}
		activeTransition = transition;
		transition.finished
			.catch( () => {} )
			.then( () => {
				if ( activeTransition === transition ) {
					activeTransition = null;
				}
			} );
		return transition;
	};
}

/**
 * Wait for a running view transition to finish, so the next navigation doesn't cut it off.
 *
 * @param {number} timeout - Milliseconds to wait at most.
 * @return {Promise<void>} Resolves when no transition is running.
 */
export function transitionSettled( timeout = 500 ) {
	if ( ! activeTransition ) {
		return Promise.resolve();
	}
	return Promise.race( [
		activeTransition.finished.catch( () => {} ),
		new Promise( resolve => setTimeout( resolve, timeout ) ),
	] ).then( () => undefined );
}
