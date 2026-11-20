/**
 * Loads the VideoPress player bundle into a document once and hands out its `videopress()` factory.
 *
 * Shared by the front-end boot script and the block editor, which mounts players into the
 * editor canvas: a document of its own when the canvas is iframed.
 */

export const PLAYER_ID_PREFIX = 'videopress-player-';

export type PlayerOptions = Record< string, unknown >;
export type PlayerStatus = 'loading' | 'ready' | 'playing' | 'pause' | 'ended' | 'stalled';
export type PlayerApi = {
	controls: {
		play: () => Promise< unknown >;
		pause: () => Promise< unknown >;
		seek: ( timeMs: number ) => Promise< unknown >;
	};
	status: {
		onPlayerStatusChanged: (
			callback: ( oldStatus: PlayerStatus, newStatus: PlayerStatus ) => void
		) => unknown;
		onTimeUpdate: ( callback: ( seconds: number ) => void ) => unknown;
	};
};
export type PlayerHandle = { destroy: () => void; api: PlayerApi | null };
export type PlayerFactory = (
	guid: string,
	container: HTMLElement,
	options: PlayerOptions
) => PlayerHandle | undefined;
export type AssetConfig = { script: string; style: string };

declare global {
	interface Window {
		videopress?: PlayerFactory;
		jetpackVideoPressInlinePlayer?: AssetConfig;
	}
}

const loading = new WeakMap< Document, Promise< PlayerFactory > >();

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
 * Resolve the player factory, fetching the bundle and its stylesheet at most once per document.
 *
 * @param doc    - The document to load the player into; the page's own by default.
 * @param config - Where the bundle lives; the config PHP printed by default.
 * @return The `videopress()` factory of that document's window once the bundle has run.
 */
export function ensurePlayer(
	doc: Document = document,
	config: AssetConfig | undefined = window.jetpackVideoPressInlinePlayer
): Promise< PlayerFactory > {
	const win = doc.defaultView;
	if ( typeof win?.videopress === 'function' ) {
		return Promise.resolve( win.videopress );
	}
	const pending = loading.get( doc );
	if ( pending ) {
		return pending;
	}

	if ( ! config?.script ) {
		return Promise.reject( new Error( 'VideoPress inline player: no bundle URL configured.' ) );
	}

	const promise = new Promise< PlayerFactory >( ( resolve, reject ) => {
		if ( config.style && ! doc.querySelector( `link[href="${ config.style }"]` ) ) {
			const link = doc.createElement( 'link' );
			link.rel = 'stylesheet';
			link.href = config.style;
			doc.head.appendChild( link );
		}

		// PHP may already have enqueued the bundle for an eager placeholder; wait on that tag instead of adding one.
		let script = Array.from( doc.scripts ).find(
			s => s.src && withoutQuery( s.src ) === withoutQuery( config.script )
		);
		if ( ! script ) {
			script = doc.createElement( 'script' );
			script.src = config.script;
			script.async = true;
			doc.head.appendChild( script );
		}

		script.addEventListener(
			'load',
			() => {
				if ( typeof doc.defaultView?.videopress === 'function' ) {
					resolve( doc.defaultView.videopress );
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
	loading.set( doc, promise );

	// A failed fetch must not poison every later attempt.
	promise.catch( () => {
		loading.delete( doc );
	} );

	return promise;
}

/**
 * Hand an earlier instance of the same video a unique element id before this one mounts.
 *
 * The bundle names its element after the GUID and adopts any element already carrying that
 * name, so a second embed of one video would otherwise pile onto the first.
 *
 * @param guid      - The video being mounted.
 * @param container - The element about to receive it.
 */
export function releasePlayerId( guid: string, container: HTMLElement ): void {
	const doc = container.ownerDocument;
	const id = PLAYER_ID_PREFIX + guid;
	const holder = doc.getElementById( id );
	if ( ! holder || container.contains( holder ) ) {
		return;
	}
	let unique = id;
	for ( let n = 2; doc.getElementById( unique ); n++ ) {
		unique = `${ id }-${ n }`;
	}
	// video.js moves the id to its wrapper and suffixes the tag it wrapped.
	const tag = doc.getElementById( `${ id }_html5_api` );
	holder.id = unique;
	if ( tag && holder.contains( tag ) ) {
		tag.id = `${ unique }_html5_api`;
	}
}
