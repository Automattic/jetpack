import { useEffect, useRef } from '@wordpress/element';

/**
 * Let the Jetpack admin shell ask before it opens this page at another route.
 *
 * The shell dispatches a cancelable `jetpack-admin-shell:before-leave` event; without the shell, nothing does.
 *
 * @param confirmLeave - Returns false to stay, after asking the user if there are unsaved changes.
 */
export default function useAdminShellLeaveGuard( confirmLeave: () => boolean ): void {
	const confirmRef = useRef( confirmLeave );
	confirmRef.current = confirmLeave;

	useEffect( () => {
		const onBeforeLeave = ( event: Event ) => {
			if (
				( event as CustomEvent ).detail?.page === 'jetpack-newsletter' &&
				! confirmRef.current()
			) {
				event.preventDefault();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
		return () => window.removeEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
	}, [] );
}
