/*
 * Modals, popovers and snackbars render into `<body>`, outside their app, so hiding the app
 * leaves them on screen. What is added to `<body>` is tagged with the page showing when it
 * appeared, and hidden while another page shows if it holds an overlay. Anything else, such as
 * another plugin's chat launcher, stays put.
 */
import { log } from './debug';

const PAGE = 'data-shell-overlay-of';
const HIDDEN = 'data-shell-overlay-hidden';

// Elements that belong to the document, not to a page.
const DOCUMENT_ELEMENTS = [
	'script',
	'style',
	'link',
	'template',
	'iframe',
	'#wpwrap',
	'.a11y-speak-region',
	'.a11y-speak-intro-text',
].join( ', ' );

// Containers every page renders its overlays into: their children are tagged, not them.
const SHARED_CONTAINERS = [
	'[data-wp-compat-overlay-slot]',
	'.components-popover__fallback-container',
].join( ', ' );

// What makes an element an overlay: dialogs, popovers, menus and notices.
const OVERLAY_CONTENT = [
	'[role="dialog"]',
	'[role="alertdialog"]',
	'[role="menu"]',
	'[role="listbox"]',
	'[role="tooltip"]',
	'.components-modal__screen-overlay',
	'.components-popover',
	'.components-snackbar-list',
	'[data-base-ui-portal]',
].join( ', ' );

const holdsOverlay = el => el.matches( OVERLAY_CONTENT ) || !! el.querySelector( OVERLAY_CONTENT );

// Where overlays can be: right under <body>, or right under a shared container.
const OVERLAYS = `body > [${ PAGE }], :is(${ SHARED_CONTAINERS }) > [${ PAGE }]`;

/**
 * Start tagging overlays with the page on screen.
 *
 * @param {Function} getVisible - Returns the slug of the page on screen.
 */
export function trackOverlays( getVisible ) {
	const style = document.createElement( 'style' );
	style.textContent = `[${ HIDDEN }] { display: none !important; }`;
	document.head.append( style );

	const observer = new MutationObserver( records =>
		records.forEach( record => record.addedNodes.forEach( tag ) )
	);
	const tag = node => {
		if ( ! ( node instanceof HTMLElement ) || node.hasAttribute( PAGE ) ) {
			return;
		}
		if ( node.matches( SHARED_CONTAINERS ) ) {
			[ ...node.children ].forEach( tag );
			observer.observe( node, { childList: true } );
		} else if ( ! node.matches( DOCUMENT_ELEMENTS ) ) {
			node.setAttribute( PAGE, getVisible() );
		}
	};
	// Overlays opened before the shell started belong to the page that was loaded.
	[ ...document.body.children ].forEach( tag );
	observer.observe( document.body, { childList: true } );
}

/**
 * Show the overlays of the page on screen and hide every other page's.
 *
 * @param {string} slug - Page now on screen.
 */
export function showOverlaysOf( slug ) {
	document.querySelectorAll( OVERLAYS ).forEach( el => {
		el.toggleAttribute( HIDDEN, el.getAttribute( PAGE ) !== slug && holdsOverlay( el ) );
	} );
}

// The longest a page gets to update its URL after its overlay closes.
const SETTLE_TIMEOUT = 100;

/**
 * Close the overlay a link was clicked in, as leaving the page with a page load would.
 *
 * Resolves once the page has written its URL for the closed overlay, so that write lands
 * before the switch and the page reopens without it.
 *
 * @param {Element} link - The clicked link.
 * @return {Promise<boolean>} Resolves when it is safe to switch pages: whether an overlay closed.
 */
export async function closeOverlayAround( link ) {
	const overlay = link.closest( OVERLAYS );
	if ( ! overlay ) {
		return false;
	}
	const before = location.href;
	// Dialogs from @wordpress/ui and @wordpress/components both close on Escape.
	link.dispatchEvent(
		new KeyboardEvent( 'keydown', {
			key: 'Escape',
			code: 'Escape',
			bubbles: true,
			cancelable: true,
		} )
	);
	const start = performance.now();
	while ( location.href === before && performance.now() - start < SETTLE_TIMEOUT ) {
		await new Promise( resolve => requestAnimationFrame( resolve ) );
	}
	log(
		'switch',
		`closed the ${ overlay.getAttribute( PAGE ) } overlay the link was in, URL ${
			location.href === before ? 'unchanged' : 'updated'
		}`,
		location.search
	);
	return true;
}
