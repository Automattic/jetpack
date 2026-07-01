/**
 * External dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Give a dashboard modal its own browser history entry while it's open, so the
 * Back button closes the modal (returning to the current view) instead of
 * leaving the page. Opening pushes an entry; Back — or closing the modal, which
 * should call `window.history.back()` — pops it and runs `onClose`.
 *
 * @param isOpen  - Whether the modal is currently open.
 * @param onClose - Called to close the modal when the history entry is popped.
 */
export function useModalHistory( isOpen: boolean, onClose: () => void ): void {
	const onCloseRef = useRef( onClose );
	onCloseRef.current = onClose;

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		window.history.pushState( { videopressModal: true }, '' );

		const handlePopState = () => onCloseRef.current();
		window.addEventListener( 'popstate', handlePopState );

		return () => {
			window.removeEventListener( 'popstate', handlePopState );
		};
	}, [ isOpen ] );
}
