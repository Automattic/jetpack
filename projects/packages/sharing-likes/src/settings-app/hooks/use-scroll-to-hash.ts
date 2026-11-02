import { useEffect } from '@wordpress/element';

/**
 * The element ID the URL hash names.
 *
 * @return ID, or an empty string.
 */
function hashId(): string {
	const raw = window.location.hash.slice( 1 );
	try {
		return decodeURIComponent( raw );
	} catch {
		// Browsers keep a bare `%` in the hash, which decodeURIComponent() refuses.
		return raw;
	}
}

/**
 * Scroll to the element the URL hash names, which did not exist when the browser looked for it.
 *
 * @param ready - Whether the sections have rendered.
 */
export function useScrollToHash( ready: boolean ) {
	useEffect( () => {
		const id = hashId();
		if ( ready && id ) {
			document.getElementById( id )?.scrollIntoView();
		}
	}, [ ready ] );
}
