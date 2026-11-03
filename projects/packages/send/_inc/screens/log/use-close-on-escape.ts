import { useEffect } from '@wordpress/element';

const POPUP_SELECTOR = '[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]';
// Open anywhere on the page, these take Escape for themselves; the resend dialog counts while it animates out.
const OPEN_SELECTOR = '[role="menu"], [role="alertdialog"], .jetpack-send-resend';
// The admin bar keeps its menus in the page all the time, so they never count as open.
const ALWAYS_THERE_SELECTOR = '#wpadminbar, [hidden], [aria-hidden="true"]';
// A trigger whose popup is open, or a DataViews filter chip (no aria-haspopup). A plain disclosure,
// like Technical details' header (also a role="button" div), isn't one.
const OPEN_TRIGGER_SELECTOR =
	'[aria-expanded="true"][aria-haspopup]:not([aria-haspopup="false"]), .dataviews-filters__summary-chip[aria-expanded="true"]';

/**
 * Whether Escape belongs to something else: a search box it clears, a popup the key came from, a
 * trigger whose menu is open, or a menu or dialog open elsewhere on the page.
 *
 * @param target - Where the key was pressed.
 * @return True to leave the panel open.
 */
function escapeTakenElsewhere( target: EventTarget | null ): boolean {
	const element = target as Element | null;
	return (
		// A search box with words in it clears them on Escape; the next Escape closes the panel.
		( element instanceof HTMLInputElement && element.type === 'search' && element.value !== '' ) ||
		!! element?.closest?.( POPUP_SELECTOR ) ||
		!! element?.closest?.( OPEN_TRIGGER_SELECTOR ) ||
		Array.from( document.querySelectorAll( OPEN_SELECTOR ) ).some(
			open => ! open.closest( ALWAYS_THERE_SELECTOR )
		)
	);
}

/**
 * Call `onClose` when Escape is pressed anywhere on the page, as Protect's side panel does.
 * A menu, list or dialog that's open (or already handled the key) closes first. What was open is
 * read as the key goes down, before a menu closing on the same key can leave the page.
 *
 * @param onClose - Closes the panel.
 */
export default function useCloseOnEscape( onClose: () => void ) {
	useEffect( () => {
		let taken: Event | null = null;
		const onKeyDownCapture = ( event: KeyboardEvent ) => {
			taken = event.key === 'Escape' && escapeTakenElsewhere( event.target ) ? event : null;
		};
		const onKeyDown = ( event: KeyboardEvent ) => {
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
