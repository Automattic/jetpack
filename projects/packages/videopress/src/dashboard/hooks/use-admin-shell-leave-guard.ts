import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type BeforeLeaveDetail = { page?: string; url?: string };

/**
 * Answer the admin shell's `jetpack-admin-shell:before-leave` event; see the admin-ui README.
 *
 * @param hasUnsavedChanges - Whether leaving would discard edits.
 * @return Whether the shell asked during this task, so a popstate guard that follows can skip asking again.
 */
export function useAdminShellLeaveGuard( hasUnsavedChanges: () => boolean ): () => boolean {
	const dirtyRef = useRef( hasUnsavedChanges );
	dirtyRef.current = hasUnsavedChanges;
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
			if (
				dirtyRef.current() &&
				// eslint-disable-next-line no-alert -- The shell needs the answer before it navigates.
				! window.confirm(
					__( 'You have unsaved changes in VideoPress. Discard them?', 'jetpack-videopress-pkg' )
				)
			) {
				event.preventDefault();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
		return () => window.removeEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
	}, [] );

	return useCallback( () => askedRef.current, [] );
}
