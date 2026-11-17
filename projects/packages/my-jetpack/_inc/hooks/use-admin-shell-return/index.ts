import { useEffect } from 'react';

/**
 * Call back each time the admin shell shows My Jetpack again after keeping it mounted while hidden.
 *
 * Such a return is a new visit, so views recorded on mount are recorded again: see the admin-ui README.
 *
 * @param callback - Called on each return. Memoize it, or it is subscribed again on every render.
 */
export default function useAdminShellReturn( callback: () => void ): void {
	useEffect( () => {
		const onShown = ( event: Event ) => {
			const { page, firstShow } = ( event as CustomEvent ).detail ?? {};
			if ( page === 'my-jetpack' && ! firstShow ) {
				callback();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );
		return () => window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
	}, [ callback ] );
}
