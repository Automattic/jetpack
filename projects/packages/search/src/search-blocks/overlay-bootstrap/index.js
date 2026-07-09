/**
 * Bootstraps the Search blocks overlay.
 *
 * Perf shape: the rendered template lives inside a `<template>` element, whose
 * `[data-wp-interactive]` regions are invisible to `document.querySelectorAll`
 * and so are skipped by the IA runtime's DOMContentLoaded hydration walk. On
 * first open the bootstrap clones the template content into the visible shell
 * and hydrates the freshly-added regions via `@wordpress/interactivity`'s
 * `privateApis`. Subsequent opens just toggle the `hidden` attribute.
 */

import { getSearchOwnedParamKeys } from '../store/url-state.js';
// Side-effect import: the bootstrap calls
// `store('jetpack-search').actions.dispatchInitialSearchIfNeeded()` after
// hydrating the cloned subtree. Without this import the bootstrap can run
// before the per-block view modules pull in `jetpack-search/store`, and the
// action would still be undefined at call time. Bare specifier resolves to the
// shared `jetpack-search/store` Script Module via `DependencyExtractionPlugin`
// (see tools/webpack.blocks.config.js); does NOT inline the store.
import 'jetpack-search/store';

const PRIVATE_API_CONSENT =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';

const OVERLAY_ID = 'jetpack-search-block-overlay';
const TEMPLATE_ID = 'jetpack-search-block-overlay-template';
const BODY_OPEN_CLASS = 'jetpack-search-block-overlay-open';
const CONFIG_GLOBAL = 'JetpackSearchBlockOverlay';

const config = ( typeof window !== 'undefined' && window[ CONFIG_GLOBAL ] ) || {};
const triggerSelector = config.overlayTriggerSelector || '';
const searchInputSelector = config.searchInputSelector || '';

let lastFocusedTrigger = null;
let savedScrollY = 0;
// Holds the in-flight hydration promise. Storing the promise (rather than a
// boolean flag) means concurrent `openOverlay()` calls all `await` the same
// hydration job instead of one racing past it while the import is still
// resolving.
let hydrationPromise = null;

/**
 * Look up the overlay root element by id.
 *
 * @return {HTMLElement|null} The overlay root element, if rendered.
 */
function getOverlay() {
	return document.getElementById( OVERLAY_ID );
}

/**
 * Whether the overlay is currently visible.
 *
 * @param {HTMLElement|null} overlay - The overlay root.
 * @return {boolean} True if the overlay is rendered and not hidden.
 */
function isOpen( overlay ) {
	return overlay && ! overlay.hasAttribute( 'hidden' );
}

/**
 * Move the rendered template content into the overlay shell and hydrate
 * its Interactivity API regions. Idempotent and concurrency-safe — the
 * first call kicks off the work and stores the promise; subsequent calls
 * (including those racing in while the dynamic import is still resolving)
 * await the same job.
 *
 * @return {Promise<void>} Resolves when hydration is complete (or no-ops if there is nothing to hydrate).
 */
function ensureHydrated() {
	if ( hydrationPromise ) {
		return hydrationPromise;
	}
	hydrationPromise = ( async () => {
		const overlay = getOverlay();
		const template = document.getElementById( TEMPLATE_ID );
		const content = overlay?.querySelector( '.jetpack-search-block-overlay__content' );
		if ( ! overlay || ! template || ! content ) {
			return;
		}
		content.appendChild( template.content.cloneNode( true ) );

		// Hydration uses the WP Interactivity API's private surface. There is
		// no public API for hydrating content inserted after DOMContentLoaded.
		// If the privateApis contract changes, the catch leaves the overlay
		// rendered-but-inert rather than crashing the page; the IA store
		// reading from a static seed already covers initial display.
		try {
			const ia = await import( '@wordpress/interactivity' );
			if ( typeof ia.privateApis !== 'function' ) {
				return;
			}
			const apis = ia.privateApis( PRIVATE_API_CONSENT );
			if (
				typeof apis.render !== 'function' ||
				typeof apis.toVdom !== 'function' ||
				typeof apis.getRegionRootFragment !== 'function'
			) {
				return;
			}
			const regions = content.querySelectorAll( '[data-wp-interactive]' );
			for ( const region of regions ) {
				apis.render( apis.toVdom( region ), apis.getRegionRootFragment( region ) );
			}
			// Belt-and-suspenders trigger for the deep-link first fetch. The
			// `data-wp-init` directive on results-list races with the IA
			// runtime's DOMContentLoaded auto-walk for cloned regions and
			// intermittently doesn't fire — most reliably reproducible on a
			// bare `?s=` deep link, where the result was a "Searching…"
			// skeleton that never cleared. The store action is idempotent
			// (module-scope latch in `store/index.js`), so when the directive
			// does fire, this becomes a no-op.
			if ( typeof ia.store === 'function' ) {
				const { actions } = ia.store( 'jetpack-search' );
				actions?.dispatchInitialSearchIfNeeded?.();
				// Reset popover state when crossing into the wide breakpoint:
				// the overlay's CSS hides `.jetpack-search-filters-popover` at
				// ≥992px (the sidebar handles filters at that width), but the
				// store still carries `isFilterPopoverOpen: true` from a prior
				// narrow-mode open. Without this, resizing wide → narrow makes
				// the panel pop in without any user interaction.
				if ( typeof window.matchMedia === 'function' ) {
					const wideMedia = window.matchMedia( '(min-width: 992px)' );
					wideMedia.addEventListener( 'change', e => {
						if ( e.matches ) {
							actions?.closeAllPopovers?.();
						}
					} );
				}
			}
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.warn( '[jetpack-search] overlay hydration failed', e );
		}
	} )();
	return hydrationPromise;
}

/**
 * Show the overlay and move focus into it.
 *
 * @param {HTMLElement|null} [triggerEl] - Element that opened the overlay; receives focus on close.
 */
async function openOverlay( triggerEl ) {
	const overlay = getOverlay();
	if ( ! overlay || isOpen( overlay ) ) {
		return;
	}
	lastFocusedTrigger = triggerEl || overlay.ownerDocument?.activeElement || null;
	await ensureHydrated();
	overlay.removeAttribute( 'hidden' );
	// Body-scroll lock: stash the current scroll position so the underlying
	// page doesn't snap to 0 when `position: fixed` is applied (and so we
	// can restore the same position on close). Matches the legacy
	// `preventBodyScroll()` pattern.
	savedScrollY = window.scrollY || window.pageYOffset || 0;
	document.body.style.top = `-${ savedScrollY }px`;
	document.body.classList.add( BODY_OPEN_CLASS );
	const input = overlay.querySelector( 'input[type="search"]' );
	if ( input ) {
		input.focus();
		// Drop the caret at the end of any pre-existing query so the
		// visitor can keep typing to refine without hitting `End`. Mirrors
		// `focusInputWithCursorAtEnd()` in the search-input view bundle;
		// inlined here to avoid a cross-bundle import for ~3 lines. When
		// changing this block, change the sibling helper too.
		const len = input.value.length;
		try {
			input.setSelectionRange( len, len );
		} catch {
			/* noop */
		}
	}
}

/**
 * Strip every Search-owned param from the current URL and `replaceState` the
 * cleaned URL. Returns true when at least one key was actually removed.
 *
 * @return {boolean} Whether the URL was changed.
 */
function stripSearchParamsFromUrl() {
	const params = new URLSearchParams( window.location.search );
	const ownedKeys = getSearchOwnedParamKeys( params );
	if ( ownedKeys.length === 0 ) {
		return false;
	}
	for ( const key of ownedKeys ) {
		params.delete( key );
	}
	const search = params.toString();
	const newUrl = window.location.pathname + ( search ? `?${ search }` : '' ) + window.location.hash;
	window.history.replaceState( {}, '', newUrl );
	return true;
}

/**
 * Hide the overlay and restore focus to the element that opened it. When the
 * URL carried search/filter state, also strip those params and reload the
 * page so the visitor lands on the underlying page rather than WP's default
 * search-results template — matches legacy Instant Search's
 * `restorePreviousHref()` close path.
 */
function closeOverlay() {
	const overlay = getOverlay();
	if ( ! overlay || ! isOpen( overlay ) ) {
		return;
	}
	if ( stripSearchParamsFromUrl() ) {
		// Reload swaps in the no-search-params version of the page (e.g. home),
		// so we skip the local DOM-restore work — it's about to be replaced.
		window.location.reload();
		return;
	}
	overlay.setAttribute( 'hidden', '' );
	document.body.classList.remove( BODY_OPEN_CLASS );
	document.body.style.top = '';
	window.scrollTo( 0, savedScrollY );
	if ( lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function' ) {
		lastFocusedTrigger.focus();
	}
	lastFocusedTrigger = null;
}

/**
 * Document-level click handler: opens the overlay when a configured trigger is clicked.
 *
 * @param {MouseEvent} event - The click event.
 */
function handleTriggerClick( event ) {
	if ( ! triggerSelector ) {
		return;
	}
	const trigger = event.target.closest( triggerSelector );
	if ( ! trigger ) {
		return;
	}
	const overlay = getOverlay();
	if ( ! overlay || overlay.contains( trigger ) ) {
		return;
	}
	event.preventDefault();
	openOverlay( trigger );
}

/**
 * Document-level submit handler: intercepts theme search forms and routes them into the overlay.
 *
 * @param {SubmitEvent} event - The submit event.
 */
async function handleFormSubmit( event ) {
	if ( ! searchInputSelector ) {
		return;
	}
	const form = event.target;
	if ( ! ( form instanceof HTMLFormElement ) ) {
		return;
	}
	const overlay = getOverlay();
	if ( ! overlay || overlay.contains( form ) ) {
		return;
	}
	const sourceInput = form.querySelector( searchInputSelector );
	if ( ! sourceInput ) {
		return;
	}
	event.preventDefault();
	await openOverlay( sourceInput );
	const overlayInput = overlay.querySelector( 'input[type="search"]' );
	if ( overlayInput ) {
		overlayInput.value = sourceInput.value || '';
		overlayInput.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	}
}

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join( ',' );

/**
 * Document-level keydown handler: closes on Escape and traps Tab inside the
 * open overlay so keyboard users can't fall out into the inert background
 * content. The overlay's PHP shell declares `role="dialog" aria-modal="true"`,
 * which assistive tech treats as a modal — without a trap that contract is
 * violated for keyboard navigation.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleKeydown( event ) {
	const overlay = getOverlay();
	if ( ! isOpen( overlay ) ) {
		return;
	}
	if ( event.key === 'Escape' ) {
		event.preventDefault();
		closeOverlay();
		return;
	}
	if ( event.key !== 'Tab' ) {
		return;
	}
	const activeEl = overlay.ownerDocument?.activeElement;
	const focusable = Array.from( overlay.querySelectorAll( FOCUSABLE_SELECTOR ) ).filter(
		el => el.offsetParent !== null || el === activeEl
	);
	if ( focusable.length === 0 ) {
		return;
	}
	const first = focusable[ 0 ];
	const last = focusable[ focusable.length - 1 ];
	if ( event.shiftKey && activeEl === first ) {
		event.preventDefault();
		last.focus();
	} else if ( ! event.shiftKey && activeEl === last ) {
		event.preventDefault();
		first.focus();
	}
}

/**
 * Overlay-scoped click handler: close button + scrim-click dismissal.
 * Mirrors the legacy overlay's pattern of dismissing on any click outside
 * the centered card.
 *
 * @param {MouseEvent} event - The click event.
 */
function handleOverlayClick( event ) {
	const overlay = getOverlay();
	if ( ! isOpen( overlay ) ) {
		return;
	}
	// `composedPath()` snapshots the propagation path at dispatch time, so
	// child blocks that detach the clicked node mid-bubble (e.g. the Search
	// Input's `data-wp-each` re-render on suggestion select) don't leave
	// `event.target` orphaned by the time we walk for the card.
	const path = event.composedPath();
	const inPath = selector =>
		path.some( el => el instanceof Element && el.classList.contains( selector ) );
	if ( inPath( 'jetpack-search-block-overlay__close' ) ) {
		event.preventDefault();
		closeOverlay();
		return;
	}
	// Click on the scrim — anywhere outside the card — closes.
	if ( ! inPath( 'jetpack-search-block-overlay__card' ) ) {
		closeOverlay();
	}
}

/**
 * `popstate` handler: keep the overlay's visibility in sync with the URL so
 * the browser's back/forward navigation behaves like the legacy overlay.
 * The IA store owns the URL → state mapping; this only owns the
 * shell's visibility.
 *
 * - URL gains `?q=` or `?s=` while the overlay is closed → open it.
 * - URL drops both while the overlay is open → close it.
 */
function handlePopState() {
	const params = new URLSearchParams( window.location.search );
	const hasQuery = params.has( 'q' ) || params.has( 's' );
	const overlay = getOverlay();
	if ( ! overlay ) {
		return;
	}
	if ( hasQuery && ! isOpen( overlay ) ) {
		openOverlay( null );
	} else if ( ! hasQuery && isOpen( overlay ) ) {
		closeOverlay();
	}
}

document.addEventListener( 'click', handleTriggerClick, true );
document.addEventListener( 'submit', handleFormSubmit, true );
document.addEventListener( 'keydown', handleKeydown );
window.addEventListener( 'popstate', handlePopState );
const overlayEl = getOverlay();
if ( overlayEl ) {
	overlayEl.addEventListener( 'click', handleOverlayClick );
}

/**
 * Open the overlay on initial paint when the URL carries `?s=`/`?q=`, deferred
 * to an animation frame so `ensureHydrated()` clones the regions after the
 * Interactivity runtime's hydration walk — opening during it double-hydrates
 * the regions and detaches their `data-wp-each` bindings.
 */
function openOverlayFromInitialUrl() {
	requestAnimationFrame( handlePopState );
}
if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', openOverlayFromInitialUrl, { once: true } );
} else {
	openOverlayFromInitialUrl();
}
