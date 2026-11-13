import { useEffect, useRef } from '@wordpress/element';

type BeforeLeaveDetail = { page?: string; url?: string };

/**
 * Answer the admin shell's `jetpack-admin-shell:before-leave` event; see the admin-ui README.
 *
 * @param confirmLeave - Returns false to stay, after asking the user if there are unsaved changes.
 */
export function useAdminShellLeaveGuard( confirmLeave: () => boolean ): void {
	const confirmRef = useRef( confirmLeave );
	confirmRef.current = confirmLeave;

	useEffect( () => {
		const onBeforeLeave = ( event: Event ) => {
			const detail = ( event as CustomEvent< BeforeLeaveDetail | null > ).detail;
			if ( detail?.page === 'jetpack-newsletter' && ! confirmRef.current() ) {
				event.preventDefault();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
		return () => window.removeEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
	}, [] );
}
