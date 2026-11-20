import { useEffect } from '@wordpress/element';

/**
 * Ask the browser to confirm leaving the page while `active`.
 *
 * @param active - Whether there is something to lose.
 */
export function useUnsavedChangesWarning( active: boolean ) {
	useEffect( () => {
		if ( ! active ) {
			return;
		}

		const warn = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Older browsers only prompt when this is set.
			event.returnValue = '';
		};

		window.addEventListener( 'beforeunload', warn );
		return () => window.removeEventListener( 'beforeunload', warn );
	}, [ active ] );
}
