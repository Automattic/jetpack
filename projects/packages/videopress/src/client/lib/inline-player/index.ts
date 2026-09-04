/**
 * Mounts VideoPress players on the placeholders Inline_Player renders.
 *
 * Eager placeholders mount as soon as the bundle is available. Facades keep
 * their poster and only fetch the player bundle when clicked, so a page full
 * of videos costs no player script until someone presses play.
 */

export const PLACEHOLDER_SELECTOR = '.jetpack-videopress-player__inline[data-videopress-guid]';
const FACADE_ATTRIBUTE = 'data-videopress-facade';
const FACADE_CLASS = 'jetpack-videopress-player__facade';
const PRECONNECT_ORIGINS = [
	'https://public-api.wordpress.com',
	'https://videos.files.wordpress.com',
];

type PlayerOptions = Record< string, unknown >;
type PlayerFactory = ( guid: string, container: HTMLElement, options: PlayerOptions ) => unknown;
type AssetConfig = { script: string; style: string };

declare global {
	interface Window {
		videopress?: PlayerFactory;
		jetpackVideoPressInlinePlayer?: AssetConfig;
	}
}

let playerLoading: Promise< PlayerFactory > | null = null;
let connectionsWarmed = false;

/**
 * Parse the options a placeholder carries; malformed JSON yields no options.
 *
 * @param raw - The `data-videopress-options` attribute value.
 * @return The parsed options object.
 */
export function parsePlaceholderOptions( raw: string | undefined ): PlayerOptions {
	if ( ! raw ) {
		return {};
	}
	try {
		const parsed = JSON.parse( raw );
		return parsed && typeof parsed === 'object' && ! Array.isArray( parsed ) ? parsed : {};
	} catch {
		return {};
	}
}

const withoutQuery = ( url: string ) => url.split( '?' )[ 0 ];

/**
 * Resolve the player factory, fetching the bundle and its stylesheet at most once per page.
 *
 * @return The `videopress()` factory once the bundle has run.
 */
export function ensurePlayer(): Promise< PlayerFactory > {
	if ( typeof window.videopress === 'function' ) {
		return Promise.resolve( window.videopress );
	}
	if ( playerLoading ) {
		return playerLoading;
	}

	const config = window.jetpackVideoPressInlinePlayer;
	if ( ! config?.script ) {
		return Promise.reject( new Error( 'VideoPress inline player: no bundle URL configured.' ) );
	}

	playerLoading = new Promise< PlayerFactory >( ( resolve, reject ) => {
		if ( config.style && ! document.querySelector( `link[href="${ config.style }"]` ) ) {
			const link = document.createElement( 'link' );
			link.rel = 'stylesheet';
			link.href = config.style;
			document.head.appendChild( link );
		}

		// PHP may already have enqueued the bundle for an eager placeholder; wait on that tag instead of adding one.
		let script = Array.from( document.scripts ).find(
			s => s.src && withoutQuery( s.src ) === withoutQuery( config.script )
		);
		if ( ! script ) {
			script = document.createElement( 'script' );
			script.src = config.script;
			script.async = true;
			document.head.appendChild( script );
		}

		script.addEventListener(
			'load',
			() => {
				if ( typeof window.videopress === 'function' ) {
					resolve( window.videopress );
				} else {
					reject(
						new Error( 'VideoPress inline player: bundle loaded without the videopress global.' )
					);
				}
			},
			{ once: true }
		);
		script.addEventListener(
			'error',
			() => reject( new Error( 'VideoPress inline player: bundle failed to load.' ) ),
			{ once: true }
		);
	} );

	// A failed fetch must not poison every later click.
	playerLoading.catch( () => {
		playerLoading = null;
	} );

	return playerLoading;
}

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

	videopress( placeholder.dataset.videopressGuid as string, placeholder, {
		width: placeholder.offsetWidth,
		height: placeholder.offsetHeight,
		fill: true,
		...parsePlaceholderOptions( placeholder.dataset.videopressOptions ),
		...extra,
	} );
	return true;
}

/**
 * Make a facade load the bundle and mount its player on click, warming connections on hover.
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
