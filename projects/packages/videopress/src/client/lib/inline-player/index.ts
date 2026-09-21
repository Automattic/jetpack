/**
 * Mounts VideoPress players on the placeholders Inline_Player renders.
 *
 * Eager placeholders mount as soon as the bundle is available. Facades keep
 * their poster and only fetch the player bundle when clicked, so a page full
 * of videos costs no player script until someone presses play.
 */

import { ensurePlayer, parsePlaceholderOptions, releasePlayerId } from './loader';
import { resolvePoster } from './poster';
import type { PlayerFactory, PlayerOptions } from './loader';

export { ensurePlayer, parsePlaceholderOptions };

export const PLACEHOLDER_SELECTOR = '.jetpack-videopress-player__inline[data-videopress-guid]';
const FACADE_ATTRIBUTE = 'data-videopress-facade';
const FACADE_CLASS = 'jetpack-videopress-player__facade';
const POSTER_CLASS = `${ FACADE_CLASS }-poster`;
const PRECONNECT_ORIGINS = [
	'https://public-api.wordpress.com',
	'https://videos.files.wordpress.com',
];

let connectionsWarmed = false;

/**
 * Open connections to the hosts the first play will hit, once, on the first hover or focus.
 */
export function warmConnections(): void {
	if ( connectionsWarmed ) {
		return;
	}
	connectionsWarmed = true;

	const origins = new Set( PRECONNECT_ORIGINS );
	const script = window.jetpackVideoPressInlinePlayer?.script;
	if ( script ) {
		try {
			origins.add( new URL( script, window.location.href ).origin );
		} catch {
			// Not a URL we can preconnect to; the bundle still loads on click.
		}
	}

	origins.forEach( origin => {
		const link = document.createElement( 'link' );
		link.rel = 'preconnect';
		link.href = origin;
		link.crossOrigin = 'anonymous';
		document.head.appendChild( link );
	} );
}

/**
 * Mount a player on one placeholder, replacing its facade if it has one.
 *
 * @param placeholder - The placeholder element.
 * @param videopress  - The player factory from the bundle.
 * @param extra       - Options merged over the placeholder's own, e.g. `autoPlay` after a click.
 * @return Whether a player was mounted ( false when it already had one ).
 */
function mount(
	placeholder: HTMLElement,
	videopress: PlayerFactory,
	extra: PlayerOptions = {}
): boolean {
	if ( placeholder.dataset.videopressMounted ) {
		return false;
	}
	placeholder.dataset.videopressMounted = '1';
	placeholder.querySelector( `.${ FACADE_CLASS }` )?.remove();
	placeholder.classList.remove( 'is-facade' );

	const guid = placeholder.dataset.videopressGuid as string;
	releasePlayerId( guid, placeholder );
	videopress( guid, placeholder, {
		width: placeholder.offsetWidth,
		height: placeholder.offsetHeight,
		fill: true,
		...parsePlaceholderOptions( placeholder.dataset.videopressOptions ),
		...extra,
	} );
	return true;
}

/**
 * Run `callback` once `el` is within 200px of the viewport, or at once where that cannot be observed.
 *
 * @param el       - The element to watch.
 * @param callback - What to run.
 */
function whenNear( el: HTMLElement, callback: () => void ): void {
	if ( typeof IntersectionObserver !== 'function' ) {
		callback();
		return;
	}
	const observer = new IntersectionObserver(
		entries => {
			if ( entries.some( entry => entry.isIntersecting ) ) {
				observer.disconnect();
				callback();
			}
		},
		{ rootMargin: '200px' }
	);
	observer.observe( el );
}

/**
 * Look the poster up in the browser and show it, unless the player has mounted meanwhile.
 *
 * @param placeholder - The facade's placeholder element.
 * @param button      - The facade button the poster goes into.
 */
function fillPoster( placeholder: HTMLElement, button: HTMLElement ): void {
	if ( placeholder.dataset.videopressPosterResolved ) {
		return;
	}
	placeholder.dataset.videopressPosterResolved = '1';

	resolvePoster( placeholder.dataset.videopressGuid as string )
		.then( src => {
			if ( ! src || placeholder.dataset.videopressMounted || ! button.isConnected ) {
				return;
			}
			const img = placeholder.ownerDocument.createElement( 'img' );
			img.className = POSTER_CLASS;
			img.alt = '';
			img.decoding = 'async';
			img.src = src;
			// The play glyph comes later in the DOM and paints on top.
			button.insertBefore( img, button.firstChild );
		} )
		.catch( () => {} );
}

/**
 * Make a facade load the bundle and mount its player on click, warming connections on hover.
 *
 * A facade the server could not give a poster gets one from the browser before it is played.
 *
 * @param placeholder - The facade's placeholder element.
 */
function wireFacade( placeholder: HTMLElement ): void {
	if ( placeholder.dataset.videopressFacadeWired ) {
		return;
	}
	placeholder.dataset.videopressFacadeWired = '1';

	const button = placeholder.querySelector< HTMLElement >( `.${ FACADE_CLASS }` );
	const warm = () => warmConnections();
	placeholder.addEventListener( 'pointerenter', warm, { once: true } );
	placeholder.addEventListener( 'focusin', warm, { once: true } );

	( button ?? placeholder ).addEventListener( 'click', event => {
		event.preventDefault();
		button?.classList.add( 'is-loading' );
		ensurePlayer()
			// The click is the user's gesture, so the player may start with sound.
			.then( videopress => mount( placeholder, videopress, { autoPlay: true } ) )
			.catch( () => button?.classList.remove( 'is-loading' ) );
	} );

	if ( ! button ) {
		return;
	}
	const poster = button.querySelector< HTMLImageElement >( `.${ POSTER_CLASS }` );
	if ( ! poster ) {
		whenNear( placeholder, () => fillPoster( placeholder, button ) );
		return;
	}
	const replace = () => {
		poster.remove();
		fillPoster( placeholder, button );
	};
	// The image may have failed before this script ran; a failed image is complete with no size.
	if ( poster.complete && poster.naturalWidth === 0 ) {
		replace();
	} else {
		poster.addEventListener( 'error', replace, { once: true } );
	}
}

/**
 * Wire every facade and mount every eager placeholder under `root`.
 *
 * @param root - Where to look for placeholders; the whole document by default.
 * @return How many players were mounted synchronously by this call.
 */
export function mountInlinePlayers( root: ParentNode = document ): number {
	const placeholders = Array.from(
		root.querySelectorAll< HTMLElement >( PLACEHOLDER_SELECTOR )
	).filter( el => ! el.dataset.videopressMounted );
	placeholders.filter( el => el.hasAttribute( FACADE_ATTRIBUTE ) ).forEach( wireFacade );

	const eager = placeholders.filter( el => ! el.hasAttribute( FACADE_ATTRIBUTE ) );
	if ( ! eager.length ) {
		return 0;
	}

	const videopress = window.videopress;
	if ( typeof videopress === 'function' ) {
		return eager.reduce( ( count, el ) => count + ( mount( el, videopress ) ? 1 : 0 ), 0 );
	}

	// The bundle is still on its way, or was left for us to fetch: mount once it lands.
	ensurePlayer()
		.then( factory => eager.forEach( el => mount( el, factory ) ) )
		.catch( () => {} );
	return 0;
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', () => mountInlinePlayers() );
} else {
	mountInlinePlayers();
}
