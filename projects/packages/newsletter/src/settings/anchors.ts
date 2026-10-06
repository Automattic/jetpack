/**
 * Anchor of the Subscriptions section on the Settings tab, so other surfaces
 * (e.g. the Overview onboarding checklist) can link straight to it.
 */
export const SUBSCRIPTIONS_SECTION_ID = 'subscriptions';

/**
 * Id of the section the URL links to. The wp-build router keeps its whole
 * route, hash included, in the `p` query arg, so `location.hash` is empty there.
 *
 * @return The linked section id, or an empty string.
 */
export function getLinkedSectionId(): string {
	const route = new URLSearchParams( window.location.search ).get( 'p' ) ?? '';
	const hash = window.location.hash || ( route.includes( '#' ) ? route.split( '#' )[ 1 ] : '' );
	return decodeURIComponent( hash.replace( /^#/, '' ) );
}

// Room left between the sticky chrome and a section scrolled to it.
const SECTION_SCROLL_GAP = 24;

// Chrome pinned over the top of the scroll area: the dashboard's tab strip, or
// the admin bar on the legacy Settings page.
const STICKY_CHROME_SELECTORS = [ '.jp-admin-page-tabs', '#wpadminbar' ];

/**
 * Find the element that scrolls a node: the page's middle column in the
 * wp-build layout, or the document as a fallback.
 *
 * @param node - Node to start from.
 * @return The scrolling element.
 */
function getScrollParent( node: HTMLElement ): Element {
	for ( let parent = node.parentElement; parent; parent = parent.parentElement ) {
		const { overflowY } = window.getComputedStyle( parent );
		if ( /auto|scroll/.test( overflowY ) && parent.scrollHeight > parent.clientHeight ) {
			return parent;
		}
	}
	return document.scrollingElement ?? document.documentElement;
}

/**
 * Scroll a section into view below the sticky page header, which plain
 * `scrollIntoView()` leaves covering the section's top, and focus it.
 *
 * @param id - Section element id.
 */
export function scrollToSection( id: string ): void {
	const section = document.getElementById( id );
	if ( ! section ) {
		return;
	}
	section.scrollIntoView();
	section.tabIndex = -1;
	section.classList.add( 'newsletter-settings__linked-section' );
	section.focus( { preventScroll: true } );

	// Only ring the section on arrival: once the visitor moves on, clicks in it shouldn't focus it.
	const release = () => {
		section.removeAttribute( 'tabindex' );
		section.classList.remove( 'newsletter-settings__linked-section' );
		section.removeEventListener( 'focusout', release );
		section.removeEventListener( 'pointerdown', release );
	};
	section.addEventListener( 'focusout', release );
	section.addEventListener( 'pointerdown', release );
	const chromeBottom = Math.max(
		0,
		...STICKY_CHROME_SELECTORS.map(
			selector => document.querySelector( selector )?.getBoundingClientRect().bottom ?? 0
		)
	);
	const overlap = chromeBottom + SECTION_SCROLL_GAP - section.getBoundingClientRect().top;
	if ( overlap > 0 ) {
		getScrollParent( section ).scrollBy( 0, -overlap );
	}
}
