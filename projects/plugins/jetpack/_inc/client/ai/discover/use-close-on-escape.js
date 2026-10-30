/**
 * Escape closes the skill panel, as it closes Send's email panel (and Protect's
 * side panel before it), unless something else on the page wants the key.
 */

import { useEffect } from '@wordpress/element';

const POPUP_SELECTOR = '[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]';
// Open anywhere on the page, these take Escape for themselves.
const OPEN_SELECTOR = '[role="menu"], [role="listbox"], [role="alertdialog"], [role="dialog"]';
// The admin bar keeps its menus in the page all the time, so they never count as open.
const ALWAYS_THERE_SELECTOR = '#wpadminbar, [hidden], [aria-hidden="true"]';
// A trigger whose popup is open. A plain disclosure (aria-expanded alone) isn't one.
const OPEN_TRIGGER_SELECTOR = '[aria-expanded="true"][aria-haspopup]:not([aria-haspopup="false"])';

/**
 * Whether Escape belongs to something else: a search box it clears, a popup the
 * key came from, a trigger whose menu is open, or a menu or dialog open
 * elsewhere on the page (a confirm dialog, for one).
 *
 * @param {EventTarget|null} target - Where the key was pressed.
 * @return {boolean} True to leave the panel open.
 */
function escapeTakenElsewhere( target ) {
	return (
		// A search box with words in it clears them on Escape; the next Escape closes the panel.
		( target instanceof HTMLInputElement && target.type === 'search' && target.value !== '' ) ||
		!! target?.closest?.( POPUP_SELECTOR ) ||
		!! target?.closest?.( OPEN_TRIGGER_SELECTOR ) ||
		Array.from( document.querySelectorAll( OPEN_SELECTOR ) ).some(
			open => ! open.closest( ALWAYS_THERE_SELECTOR )
		)
	);
}

/**
 * Call `onClose` when Escape is pressed anywhere on the page. A menu, list or
 * dialog that's open (or already handled the key) closes first. What was open
 * is read as the key goes down, before a menu closing on the same key can
 * leave the page.
 *
 * @param {Function} onClose - Closes the panel.
 */
export default function useCloseOnEscape( onClose ) {
	useEffect( () => {
		let taken = null;
		const onKeyDownCapture = event => {
			taken = event.key === 'Escape' && escapeTakenElsewhere( event.target ) ? event : null;
		};
		const onKeyDown = event => {
			if (
				event.key === 'Escape' &&
				! event.defaultPrevented &&
				taken !== event &&
				! escapeTakenElsewhere( event.target )
			) {
				onClose();
			}
		};
		document.addEventListener( 'keydown', onKeyDownCapture, true );
		document.addEventListener( 'keydown', onKeyDown );
		return () => {
			document.removeEventListener( 'keydown', onKeyDownCapture, true );
			document.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ onClose ] );
}
