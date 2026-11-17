import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type BeforeLeaveDetail = { page?: string; url?: string };

const PAGE = 'jetpack-videopress';

/*
 * Mounted screens keep their own popstate listeners while the shell hides VideoPress. Until the
 * task that shows it again ends, a popstate belongs to another page, or is VideoPress arriving.
 */
let hiddenByShell = false;
let showing: ReturnType< typeof setTimeout > | undefined;
const isVideoPress = ( event: Event ) =>
	( event as CustomEvent< { page?: string } | null > ).detail?.page === PAGE;
window.addEventListener( 'jetpack-admin-shell:page-hidden', event => {
	if ( isVideoPress( event ) ) {
		clearTimeout( showing );
		hiddenByShell = true;
	}
} );
// The shell reports a Back's page shown in a microtask, before later popstate listeners run.
window.addEventListener( 'jetpack-admin-shell:page-shown', event => {
	if ( isVideoPress( event ) ) {
		showing = setTimeout( () => ( hiddenByShell = false ) );
	}
} );

/**
 * Whether the admin shell has VideoPress off screen, so a popstate guard should stay out of it.
 *
 * @return False without the shell.
 */
export const isHiddenByShell = (): boolean => hiddenByShell;

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
			if ( detail?.page !== PAGE ) {
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
