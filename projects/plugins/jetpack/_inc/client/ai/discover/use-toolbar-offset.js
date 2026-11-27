/**
 * Where Discover's sticky toolbar sticks. AdminPage scrolls its middle, and
 * the hub's tab strip (base-styles' `.jp-admin-page-tabs`) is sticky at the
 * top of that same scroller. A toolbar sticky at 0 lands on the strip and,
 * coming later in the page, covers it. My Jetpack's Features toolbar has no
 * strip above it, so 0 is right there; here the toolbar has to stick at the
 * strip's bottom edge instead.
 *
 * The strip's height comes from the design system's Tabs and can change with
 * the font or a wrapped row, so it's measured, not copied into the stylesheet.
 * The toolbar's own height is published too, so a card's controls scrolled
 * into view on focus stop below both sticky layers, not under them; and the
 * toolbar is marked while it's stuck, so the stylesheet can hang it from the
 * strip.
 */

import { useLayoutEffect } from '@wordpress/element';

/** The custom property the toolbar's `inset-block-start` reads. */
export const TOOLBAR_OFFSET_PROPERTY = '--jetpack-ai-discover-toolbar-offset';

/** The toolbar's height while it sticks, 0 where it doesn't, for scroll margins. */
export const TOOLBAR_HEIGHT_PROPERTY = '--jetpack-ai-discover-toolbar-height';

/** The attribute set on the toolbar while it's stuck under the strip. */
export const STUCK_ATTRIBUTE = 'data-stuck';

const TABS_SELECTOR = '.jp-admin-page-tabs';

const TOOLBAR_SELECTOR = '.jetpack-ai-discover__toolbar';

// Sub-pixel layout can leave a stuck toolbar a fraction off the strip's edge.
const STUCK_TOLERANCE = 1;

/**
 * How much room a sticky element takes at the top of its scroller: its offset
 * plus its height while it sticks, nothing when it scrolls away with the page.
 *
 * @param {HTMLElement} element - The element.
 * @return {number} The height in pixels.
 */
export function getStickyHeight( element ) {
	const { position, top } = window.getComputedStyle( element );
	return position === 'sticky' ? ( parseFloat( top ) || 0 ) + element.offsetHeight : 0;
}

/**
 * Keep the toolbar's sticky offset at the bottom of the tab strip above it,
 * publish its height, and mark it while it's stuck.
 *
 * @param {object} rootRef - Ref to Discover's root, which carries the properties.
 */
export default function useToolbarOffset( rootRef ) {
	useLayoutEffect( () => {
		const root = rootRef.current;
		// The page around Discover, where the tab strip lives. Outside AdminPage
		// (in tests, say) there is none, and the toolbar sticks at 0.
		const strip = root?.closest( '.jp-admin-page__page' )?.querySelector( TABS_SELECTOR );
		if ( ! root || ! strip ) {
			return;
		}
		const toolbar = root.querySelector( TOOLBAR_SELECTOR );

		// Stuck once it has reached the strip's bottom edge: below that it's
		// still in the page's flow. A toolbar that doesn't stick never is.
		const updateStuck = () => {
			if ( ! toolbar ) {
				return;
			}
			const stuck =
				window.getComputedStyle( toolbar ).position === 'sticky' &&
				toolbar.getBoundingClientRect().top <=
					strip.getBoundingClientRect().bottom + STUCK_TOLERANCE;
			toolbar.toggleAttribute( STUCK_ATTRIBUTE, stuck );
		};

		const update = () => {
			root.style.setProperty( TOOLBAR_OFFSET_PROPERTY, `${ getStickyHeight( strip ) }px` );
			// Only a toolbar that sticks can cover anything.
			const toolbarHeight = toolbar && getStickyHeight( toolbar ) ? toolbar.offsetHeight : 0;
			root.style.setProperty( TOOLBAR_HEIGHT_PROPERTY, `${ toolbarHeight }px` );
			updateStuck();
		};
		update();

		// Whichever scroller moves: scroll events don't bubble, so this listens
		// on the way down. One check a frame, however fast the wheel turns.
		let frame = 0;
		const onScroll = () => {
			if ( ! frame ) {
				frame = window.requestAnimationFrame( () => {
					frame = 0;
					updateStuck();
				} );
			}
		};
		document.addEventListener( 'scroll', onScroll, { capture: true, passive: true } );

		const observer =
			typeof window.ResizeObserver === 'undefined' ? null : new window.ResizeObserver( update );
		observer?.observe( strip );
		if ( toolbar ) {
			observer?.observe( toolbar );
		}
		return () => {
			observer?.disconnect();
			document.removeEventListener( 'scroll', onScroll, { capture: true } );
			window.cancelAnimationFrame( frame );
			root.style.removeProperty( TOOLBAR_OFFSET_PROPERTY );
			root.style.removeProperty( TOOLBAR_HEIGHT_PROPERTY );
			toolbar?.removeAttribute( STUCK_ATTRIBUTE );
		};
	}, [ rootRef ] );
}
