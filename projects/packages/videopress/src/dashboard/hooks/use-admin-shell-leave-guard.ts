import { useCallback, useEffect, useRef } from '@wordpress/element';

type BeforeLeaveDetail = { page?: string; url?: string };

/**
 * Answer the admin shell's `jetpack-admin-shell:before-leave` event; see the admin-ui README.
 *
 * @param confirmLeave - Returns false to stay, after asking the user if there are unsaved changes.
 * @return Whether the shell asked during this task, so a popstate guard that follows can skip asking again.
 */
export function useAdminShellLeaveGuard( confirmLeave: () => boolean ): () => boolean {
	const confirmRef = useRef( confirmLeave );
	confirmRef.current = confirmLeave;
	const askedRef = useRef( false );

	useEffect( () => {
		const onBeforeLeave = ( event: Event ) => {
			const detail = ( event as CustomEvent< BeforeLeaveDetail | null > ).detail;
			if ( detail?.page !== 'jetpack-videopress' ) {
				return;
			}
			askedRef.current = true;
			// The shell's navigation, and the popstate it causes, finish within this task.
			setTimeout( () => ( askedRef.current = false ) );
			if ( ! confirmRef.current() ) {
				event.preventDefault();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
		return () => window.removeEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
	}, [] );

	return useCallback( () => askedRef.current, [] );
}
