/**
 * External dependencies
 */
import { useEffect } from 'react';

const useUnloadPrevent = ( {
	shouldPrevent = false,
	message,
}: {
	shouldPrevent?: boolean;
	message: string;
} ) => {
	useEffect( () => {
		if ( ! shouldPrevent ) {
			return;
		}

		const beforeUnloadListener = event => {
			event.preventDefault();
			// Note: The message only shows on older browsers, with a standard non-customizable message on current browsers
			// ref https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#compatibility_notes
			event.returnValue = message;
			return;
		};

		window.addEventListener( 'beforeunload', beforeUnloadListener );

		return () => {
			window.removeEventListener( 'beforeunload', beforeUnloadListener );
		};
	}, [ shouldPrevent ] );
};

export default useUnloadPrevent;
