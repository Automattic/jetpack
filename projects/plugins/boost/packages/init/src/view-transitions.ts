/** Observe the chassis transitions for the lifetime of the Boost admin page. */
export function handleSkippedViewTransitions(): void {
	const startViewTransition = document.startViewTransition;
	if ( ! startViewTransition ) {
		return;
	}

	document.startViewTransition = function ( ...args ) {
		const transition = startViewTransition.apply( this, args );
		void transition.ready.catch( error => {
			if (
				error instanceof DOMException &&
				error.name === 'AbortError' &&
				error.message === 'Transition was skipped. New ViewTransition started'
			) {
				return;
			}
			throw error;
		} );
		return transition;
	};
}
