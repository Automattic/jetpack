/*
 * A progress bar in the content area while a dashboard boots, the same for every page. The shell
 * takes it down with the stand-in header, once the page's own heading renders.
 */
import { log } from './debug';

// How far below the content area's top the last stand-in header ended, for a page showing none.
const OFFSET_KEY = 'jetpack-admin-shell-loader-offset';
// A switch that is over sooner shows nothing, so a prewarmed dashboard doesn't flash a bar.
const SHOW_AFTER = 120;
const STYLE_ID = 'jetpack-admin-shell-loader-style';
const BAR_WIDTH = 200;

const LOADER_CSS = `
.jetpack-admin-shell-loader {
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

let headerOffset = null;
const readOffset = () => {
	try {
		headerOffset ??= parseInt( localStorage.getItem( OFFSET_KEY ) ?? '0', 10 ) || 0;
	} catch {
		headerOffset ??= 0;
	}
	return headerOffset;
};
const saveOffset = () => {
	try {
		localStorage.setItem( OFFSET_KEY, String( headerOffset ) );
	} catch {
		// Blocked storage: a page with no stand-in puts the bar a little higher.
	}
};

// The page header in a stand-in: admin-ui's CSS module class ends in `__header`, and it holds the heading.
const headerIn = standIn =>
	[ ...( standIn?.querySelectorAll( '[class*="__header"]' ) ?? [] ) ].find(
		node =>
			[ ...node.classList ].some( name => name.endsWith( '__header' ) ) &&
			node.querySelector( 'h1' )
	);

// Centre the bar in the visible space under the page's stand-in header, or where one last ended.
const place = ( track, slug, el ) => {
	const box = (
		document.getElementById( 'wpbody-content' ) ?? el.parentElement
	).getBoundingClientRect();
	const header = headerIn(
		document.querySelector( `[data-shell-header="${ CSS.escape( slug ) }"]` )
	)?.getBoundingClientRect();
	if ( header ) {
		headerOffset = Math.round( header.bottom - box.top );
	}
	const { left, width } = header ?? box;
	const top = header?.bottom ?? box.top + readOffset();
	const adminBar = document.getElementById( 'wpadminbar' )?.getBoundingClientRect().bottom ?? 0;
	const barWidth = Math.min( BAR_WIDTH, width );
	Object.assign( track.style, {
		top: `${ Math.round( ( Math.max( top, adminBar ) + window.innerHeight ) / 2 ) }px`,
		left: `${ left + ( width - barWidth ) / 2 }px`,
		width: `${ barWidth }px`,
	} );
};

// Removers of the loaders on screen, by page.
const loaders = new Map();

/**
 * Remove a page's loader, if it has one.
 *
 * @param {string} slug - Page slug.
 */
export function removeLoader( slug ) {
	loaders.get( slug )?.();
}

/**
 * Show the loader for a page until it is removed.
 *
 * @param {string}      slug  - Page being opened.
 * @param {HTMLElement} el    - Its mount element; the loader goes right before it.
 * @param {string}      label - Page title, for assistive technology.
 * @return {Function} Removes the loader.
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
	const paint = value => {
		progress = value;
		node.style.setProperty( '--jetpack-admin-shell-progress', progress.toFixed( 3 ) );
		node.setAttribute( 'aria-valuenow', String( Math.round( progress * 100 ) ) );
	};
	// Re-placed every frame: the stand-in header it sits under can scroll with the page.
	const follow = () => {
		place( track, slug, el );
		frame = requestAnimationFrame( follow );
	};
	const showTimer = setTimeout( () => {
		follow();
		node.classList.add( 'is-shown' );
		paint( 0.08 );
		// Creeps towards 90% on its own, ever slower, so it never stalls nor claims to be done.
		trickle = setInterval( () => paint( progress + ( 0.9 - progress ) * 0.08 ), 250 );
	}, SHOW_AFTER );

	const remove = () => {
		clearTimeout( showTimer );
		clearInterval( trickle );
		cancelAnimationFrame( frame );
		if ( frame && headerOffset !== null ) {
			saveOffset();
		}
		node.remove();
		el.removeAttribute( 'aria-busy' );
		if ( loaders.get( slug ) === remove ) {
			loaders.delete( slug );
		}
	};
	loaders.set( slug, remove );
	log( 'loader', `showing the loader for ${ slug }` );
	return remove;
}
