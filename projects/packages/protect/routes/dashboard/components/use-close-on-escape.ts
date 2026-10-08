import { useEffect } from '@wordpress/element';

const POPUP_SELECTOR = '[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]';

/**
 * Call `onClose` when Escape is pressed anywhere on the page.
 *
 * Skips presses a menu, listbox or dialog handled or had focus for, so Escape closes those first.
 *
 * @param onClose - Closes the inspector.
 */
export default function useCloseOnEscape( onClose: () => void ) {
	useEffect( () => {
		const onKeyDown = ( event: KeyboardEvent ) => {
			const target = event.target as Element | null;
			if (
				event.key === 'Escape' &&
				! event.defaultPrevented &&
				! target?.closest?.( POPUP_SELECTOR )
			) {
				onClose();
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ onClose ] );
}
