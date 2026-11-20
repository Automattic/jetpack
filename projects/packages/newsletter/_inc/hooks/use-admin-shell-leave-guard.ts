import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type BeforeLeaveDetail = { page?: string; url?: string };

let discarded = false;

/**
 * Whether the user just agreed, through the admin shell, to discard Newsletter's changes, so `beforeunload` needn't ask again.
 *
 * @return False without the shell.
 */
export const discardedThroughShell = (): boolean => discarded;

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
			if ( detail?.page !== 'jetpack-newsletter' || ! dirtyRef.current() ) {
				return;
			}
			if (
				// eslint-disable-next-line no-alert -- The shell needs the answer before it navigates.
				window.confirm(
					__( 'You have unsaved changes in Newsletter. Discard them?', 'jetpack-newsletter' )
				)
			) {
				discarded = true;
				// Chromium fires the page load's beforeunload within this task; elsewhere the user may just be asked twice.
				setTimeout( () => ( discarded = false ) );
			} else {
				event.preventDefault();
			}
		};
		window.addEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
		return () => window.removeEventListener( 'jetpack-admin-shell:before-leave', onBeforeLeave );
	}, [] );
}
