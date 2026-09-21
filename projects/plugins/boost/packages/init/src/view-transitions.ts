const installed = new WeakSet< typeof document.startViewTransition >();

/** The Advanced no-issues redirect can skip the chassis's preceding hash transition. */
export function handleSkippedViewTransitions(): void {
	const startViewTransition = document.startViewTransition;
	if ( ! startViewTransition || installed.has( startViewTransition ) ) {
		return;
	}

	document.startViewTransition = function ( ...args ) {
		const transition = startViewTransition.apply( this, args );
		void transition.ready.catch( error => {
			if ( error?.name === 'AbortError' ) {
				return;
			}
			// Update failures still reject finished and updateCallbackDone; do not create another rejection.
			return error;
		} );
		return transition;
	};
	installed.add( document.startViewTransition );
}
