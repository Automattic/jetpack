/*
 * A progress bar in the content area while a dashboard boots, the same for every page. It is gone
 * before the page's content shows, so the two never overlap.
 */
import { log } from './debug';

// How far below the content area's top the last header seen ended, for a page showing none.
const OFFSET_KEY = 'jetpack-admin-shell-loader-offset';
// A switch that is over sooner shows nothing, so a prewarmed dashboard doesn't flash a bar.
const SHOW_AFTER = 120;
const STYLE_ID = 'jetpack-admin-shell-loader-style';
const BAR_WIDTH = 200;

const LOADER_CSS = `
.jetpack-admin-shell-loader {
	block-size: 0;
	margin: 0 !important;
	padding: 0 !important;
	pointer-events: none;
	opacity: 0;
	transition: opacity 160ms ease-out;
}
.jetpack-admin-shell-loader.is-shown { opacity: 1; }
.jetpack-admin-shell-loader__track {
	position: fixed;
	z-index: 10;
	block-size: 2px;
	border-radius: 2px;
	overflow: hidden;
	background: color-mix(in srgb, #1e1e1e 8%, transparent);
}
.jetpack-admin-shell-loader__fill {
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: var(--wp-admin-theme-color, #3858e9);
	opacity: 0.85;
	transform-origin: left center;
	transform: scaleX(var(--jetpack-admin-shell-progress, 0));
	transition: transform 400ms cubic-bezier(.2,.7,.3,1);
}
[dir="rtl"] .jetpack-admin-shell-loader__fill { transform-origin: right center; }
`;

const addStyle = () => {
	if ( document.getElementById( STYLE_ID ) ) {
		return;
	}
	const style = document.createElement( 'style' );
	style.id = STYLE_ID;
	style.textContent = LOADER_CSS;
	document.head.append( style );
};

const savedOffset = () => {
	try {
		return parseInt( localStorage.getItem( OFFSET_KEY ) ?? '0', 10 ) || 0;
	} catch {
		return 0;
	}
};

const saveOffset = offset => {
	try {
		localStorage.setItem( OFFSET_KEY, String( offset ) );
	} catch {
		// Blocked storage: a page with no header puts the bar a little higher.
	}
};

// admin-ui's page header: its CSS module class ends in `__header`, and it holds the page heading.
const headerIn = root =>
	[ ...( root?.querySelectorAll( '[class*="__header"]' ) ?? [] ) ].find(
		node =>
			[ ...node.classList ].some( name => name.endsWith( '__header' ) ) &&
			node.querySelector( 'h1' ) &&
			node.getClientRects().length
	);

// Centre the bar in the visible space under whichever header is on screen, stand-in or the page's own.
const place = ( track, slug, el ) => {
	const content = document.getElementById( 'wpbody-content' ) ?? el.parentElement;
	const box = content.getBoundingClientRect();
	const standIn = document.querySelector( `[data-shell-header="${ CSS.escape( slug ) }"]` );
	const header = headerIn( standIn ) ?? headerIn( el );
	let top = box.top + savedOffset();
	let { left, width } = box;
	if ( header ) {
		const rect = header.getBoundingClientRect();
		( { left, width } = rect );
		top = rect.bottom;
		saveOffset( Math.round( rect.bottom - box.top ) );
	}
	const adminBar = document.getElementById( 'wpadminbar' )?.getBoundingClientRect().bottom ?? 0;
	const barWidth = Math.min( BAR_WIDTH, width );
	Object.assign( track.style, {
		top: `${ Math.round( ( Math.max( top, adminBar ) + window.innerHeight ) / 2 ) }px`,
		left: `${ left + ( width - barWidth ) / 2 }px`,
		width: `${ barWidth }px`,
	} );
};

// Loaders on screen, by page.
const loaders = new Map();

/**
 * Remove a page's loader, if it has one.
 *
 * @param {string} slug - Page slug.
 */
export function removeLoader( slug ) {
	loaders.get( slug )?.remove();
}

/**
 * Show the loader for a page until it renders.
 *
 * @param {string}      slug  - Page being opened.
 * @param {HTMLElement} el    - Its mount element; the loader goes right before it.
 * @param {string}      label - Page title, for assistive technology.
 * @return {{set: Function, remove: Function}} `set( 0..1 )` reports a milestone; `remove()` takes it down.
 */
export function showLoader( slug, el, label ) {
	removeLoader( slug );
	addStyle();
	// A section: the host page's critical CSS hides every `#wpbody-content > div` but its own app.
	const node = document.createElement( 'section' );
	node.className = 'jetpack-admin-shell-loader';
	node.dataset.shellLoader = slug;
	node.setAttribute( 'role', 'progressbar' );
	node.setAttribute( 'aria-label', label ?? slug );
	node.setAttribute( 'aria-valuemin', '0' );
	node.setAttribute( 'aria-valuemax', '100' );
	const track = document.createElement( 'div' );
	track.className = 'jetpack-admin-shell-loader__track';
	const fill = document.createElement( 'div' );
	fill.className = 'jetpack-admin-shell-loader__fill';
	track.append( fill );
	node.append( track );
	el.before( node );
	el.setAttribute( 'aria-busy', 'true' );

	let progress = 0;
	let trickle = 0;
	let frame = 0;
	let gone = false;
	const paint = value => {
		progress = Math.min( 1, Math.max( progress, value ) );
		node.style.setProperty( '--jetpack-admin-shell-progress', progress.toFixed( 3 ) );
		node.setAttribute( 'aria-valuenow', String( Math.round( progress * 100 ) ) );
	};
	const showTimer = setTimeout( () => {
		node.classList.add( 'is-shown' );
		paint( 0.08 );
		// Creeps towards 90% on its own, ever slower, so it never stalls nor claims to be done.
		trickle = setInterval( () => paint( progress + ( 0.9 - progress ) * 0.08 ), 250 );
	}, SHOW_AFTER );

	const controls = {
		set: value => ! gone && paint( value ),
		remove: () => {
			gone = true;
			clearTimeout( showTimer );
			clearInterval( trickle );
			cancelAnimationFrame( frame );
			node.remove();
			el.removeAttribute( 'aria-busy' );
			if ( loaders.get( slug ) === controls ) {
				loaders.delete( slug );
			}
		},
	};
	// Re-placed every frame: the header it sits under can scroll, or be swapped for the page's own.
	const follow = () => {
		// Gone the moment the page draws its heading, so it never sits on top of content.
		if ( el.style.visibility !== 'hidden' && el.querySelector( 'h1' )?.getClientRects().length ) {
			controls.remove();
			return;
		}
		place( track, slug, el );
		frame = requestAnimationFrame( follow );
	};
	loaders.set( slug, controls );
	follow();
	log( 'loader', `showing the loader for ${ slug }` );
	return controls;
}
