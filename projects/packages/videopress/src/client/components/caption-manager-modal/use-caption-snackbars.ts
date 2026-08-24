/**
 * External dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';

export type CaptionSnackbar = {
	id: string;
	content: string;
};

/**
 * Owns the caption manager's transient snackbar notices: the list rendered by
 * SnackbarList at the bottom of the modal, each bubble auto-dismissed by the
 * Snackbar component after its timeout. Success confirmations and async/API
 * failures announce here; form-validation errors stay inline instead.
 *
 * @return The snackbar list plus its add, remove, and clear callbacks.
 */
export function useCaptionSnackbars() {
	const [ snackbars, setSnackbars ] = useState< CaptionSnackbar[] >( [] );
	// Monotonic id source so each notice animates and dismisses independently.
	const nextIdRef = useRef( 0 );

	const notify = useCallback( ( content: string ) => {
		nextIdRef.current += 1;
		const id = `caption-snackbar-${ nextIdRef.current }`;
		setSnackbars( current => [ ...current, { id, content } ] );
	}, [] );

	const removeSnackbar = useCallback( ( id: string ) => {
		setSnackbars( current => current.filter( snackbar => snackbar.id !== id ) );
	}, [] );

	// Drop every bubble at once. The modal stays mounted while closed, so
	// undismissed snackbars would otherwise reappear on the next open.
	const clearSnackbars = useCallback( () => setSnackbars( [] ), [] );

	return { snackbars, notify, removeSnackbar, clearSnackbars };
}
