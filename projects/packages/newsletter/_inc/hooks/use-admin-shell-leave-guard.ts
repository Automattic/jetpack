import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type BeforeLeaveDetail = { page?: string; url?: string };

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
