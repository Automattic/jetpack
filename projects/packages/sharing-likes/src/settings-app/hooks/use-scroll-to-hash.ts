import { useEffect } from '@wordpress/element';

/**
 * Scroll to the element the URL hash names, which did not exist when the browser looked for it.
 *
 * @param ready - Whether the sections have rendered.
 */
export function useScrollToHash( ready: boolean ) {
	useEffect( () => {
		const id = decodeURIComponent( window.location.hash.slice( 1 ) );
		if ( ready && id ) {
			document.getElementById( id )?.scrollIntoView();
		}
	}, [ ready ] );
}
