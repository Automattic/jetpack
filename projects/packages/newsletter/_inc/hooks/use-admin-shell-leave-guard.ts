import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type BeforeLeaveDetail = { page?: string; url?: string };

let asked = false;
window.addEventListener( 'jetpack-admin-shell:before-leave', event => {
	if (
		( event as CustomEvent< BeforeLeaveDetail | null > ).detail?.page === 'jetpack-newsletter'
	) {
		asked = true;
		// A page load the shell asked about starts within this task.
		setTimeout( () => ( asked = false ) );
	}
} );

/**
 * Whether the admin shell asked about leaving Newsletter during this task, so `beforeunload` needn't ask again.
 *
 * @return False without the shell.
 */
export const askedByShell = (): boolean => asked;

/**
 * Answer the admin shell's `jetpack-admin-shell:before-leave` event; see the admin-ui README.
 *
 * @param hasUnsavedChanges - Whether leaving would discard edits.
 */
export function useAdminShellLeaveGuard( hasUnsavedChanges: () => boolean ): void {
	const dirtyRef = useRef( hasUnsavedChanges );
	dirtyRef.current = hasUnsavedChanges;

	useEffect( () => {
		const onBeforeLeave = ( event: Event ) => {
			const detail = ( event as CustomEvent< BeforeLeaveDetail | null > ).detail;
			if (
				detail?.page === 'jetpack-newsletter' &&
				dirtyRef.current() &&
				// eslint-disable-next-line no-alert -- The shell needs the answer before it navigates.
				! window.confirm(
					__( 'You have unsaved changes in Newsletter. Discard them?', 'jetpack-newsletter' )
				)
			) {
				event.preventDefault();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
		return () => window.removeEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
	}, [] );
}
