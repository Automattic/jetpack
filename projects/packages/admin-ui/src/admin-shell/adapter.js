/*
 * Every workaround for @wordpress/boot and TanStack Router internals lives or is re-exported here,
 * so when Gutenberg ships APIs for several apps in one document only this file changes (JETPACK-3414).
 */
import { pageOf } from './chrome';
import { log } from './debug';

export {
	trackViewTransitions,
	transitionSettled,
} from '@automattic/jetpack-wp-build-polyfills/src/js/view-transitions';

/**
 * Keep each app's router deaf to URLs that belong to another app.
 *
 * Routers subscribe to `popstate`/`hashchange` and wrap `history.pushState`/`replaceState`.
 * Whatever an app adds while it mounts is tagged with that app and only runs while it is visible.
 *
 * @param {Function} getVisible - Returns the slug of the app on screen.
 * @param {Function} onWrite    - Called after every history write reaches the browser.
 * @return {object} `mount( slug )`, `mounted( slug )`, `isMounting()`, `listen( type, listener )`, `pushUrl( url )` and `replaceUrl( url )`.
 */
export function isolateRouters( getVisible, onWrite ) {
	// Apps mounting now, latest last: what subscribes is tagged as the latest one's.
	const mountingStack = [];
	const mounting = () => mountingStack.at( -1 ) ?? null;

	const listen = window.addEventListener.bind( window );
	const unlisten = window.removeEventListener.bind( window );
	const gated = new WeakMap();
	window.addEventListener = ( type, listener, options ) => {
		if ( mounting() && listener && ( type === 'popstate' || type === 'hashchange' ) ) {
			const owner = mounting();
			if ( ! gated.has( listener ) ) {
				log(
					'router',
					`${ owner }'s router listens for ${ type }; it only hears it while ${ owner } is on screen`
				);
				gated.set( listener, event => {
					if ( owner !== getVisible() ) {
						log( 'router', `${ type } kept from ${ owner } (hidden)` );
						return;
					}
					log( 'router', `${ type } delivered to ${ owner }`, location.search );
					return typeof listener === 'function'
						? listener.call( window, event )
						: listener.handleEvent( event );
				} );
			}
			return listen( type, gated.get( listener ), options );
		}
		return listen( type, listener, options );
	};
	window.removeEventListener = ( type, listener, options ) =>
		unlisten( type, ( listener && gated.get( listener ) ) || listener, options );

	const native = {};
	for ( const method of [ 'pushState', 'replaceState' ] ) {
		native[ method ] = history[ method ].bind( history );
		const base = ( ...args ) => {
			native[ method ]( ...args );
			onWrite();
		};
		// Each wrapper calls through to the ones installed before it, skipping hidden apps' wrappers.
		const wrappers = [];
		const callBelow = level =>
			function ( ...args ) {
				// A hidden app's router can still write, e.g. when its modal closes. Drop it before any
				// wrapper runs: the visible router's wrapper would treat it as a navigation.
				const page = args[ 2 ] && pageOf( args[ 2 ] );
				if ( page && page !== getVisible() ) {
					log(
						'router',
						`dropped history.${ method } to ${ page } while ${ getVisible() } shows`,
						args[ 2 ]
					);
					return;
				}
				for ( let i = level - 1; i >= 0; i-- ) {
					if ( ! wrappers[ i ].owner || wrappers[ i ].owner === getVisible() ) {
						return wrappers[ i ].fn.apply( this, args );
					}
				}
				return base( ...args );
			};
		Object.defineProperty( history, method, {
			configurable: true,
			get: () => callBelow( wrappers.length ),
			set: fn => {
				wrappers.push( { fn, owner: mounting() } );
				log( 'router', `${ mounting() ?? 'unknown code' } wrapped history.${ method }` );
			},
		} );
	}

	return {
		mount: slug => {
			mountingStack.push( slug );
			log( 'router', `tagging routers that subscribe now as ${ slug }'s` );
		},
		// Routers subscribe before their first route renders; tagging longer would catch other code's listeners.
		mounted: slug => {
			const index = mountingStack.lastIndexOf( slug );
			if ( index !== -1 ) {
				mountingStack.splice( index, 1 );
				log( 'router', `stopped tagging for ${ slug }` );
			}
		},
		isMounting: () => mountingStack.length > 0,
		listen,
		// Bypasses the routers' wrappers: notifyRouters() tells the visible one, and two navigations
		// in a row cancel the first one's view transition. TanStack keeps its position in the state.
		pushUrl: url => {
			const key = Math.random().toString( 36 ).slice( 2 );
			const index = ( history.state?.__TSR_index ?? 0 ) + 1;
			native.pushState( { __TSR_index: index, key, __TSR_key: key }, '', url );
			log( 'router', 'URL pushed by the shell', new URL( url, location.href ).search );
			onWrite();
		},
		// Rewrites the current entry in place, keeping its state, so Back/Forward keep their count.
		replaceUrl: url => {
			native.replaceState( history.state, '', url );
			log( 'router', 'URL replaced by the shell', new URL( url, location.href ).search );
			onWrite();
		},
	};
}

/**
 * Tell the visible app's router to read the URL again.
 */
export function notifyRouters() {
	log( 'router', 'synthetic popstate so the visible router reads the URL' );
	window.dispatchEvent( new PopStateEvent( 'popstate', { state: history.state } ) );
}

/**
 * Load a page, dropping every app in this document. Kept here so tests can see it: jsdom can't stub `location`.
 *
 * @param {string}  url             - The page to load.
 * @param {object}  options         - Options.
 * @param {boolean} options.replace - Load it into the current history entry instead of a new one.
 */
export function loadPage( url, { replace = false } = {} ) {
	log( 'shell', `loading ${ url }` );
	if ( replace ) {
		location.replace( url );
	} else {
		location.assign( url );
	}
}

const importMapUrl = id =>
	[ ...document.querySelectorAll( 'script[type="importmap"]' ) ]
		.map( el => JSON.parse( el.textContent ).imports?.[ id ] )
		.find( Boolean );

/**
 * Download and parse modules without evaluating them, so a later import only has to evaluate.
 *
 * @param {string[]} ids - Module IDs in the page's import map.
 * @return {Promise<void>} Resolves once each has loaded or failed; the import reports a failure.
 */
export function preloadModules( ids ) {
	// A browser without modulepreload would fire neither load nor error.
	if ( ! document.createElement( 'link' ).relList?.supports?.( 'modulepreload' ) ) {
		return Promise.resolve();
	}
	return Promise.all(
		ids.map( id => {
			const url = importMapUrl( id );
			if ( ! url ) {
				return null;
			}
			const link = Object.assign( document.createElement( 'link' ), {
				rel: 'modulepreload',
				href: new URL( url, location.href ).href,
			} );
			const loaded = new Promise( resolve => {
				link.onload = link.onerror = resolve;
			} ).then( () => link.remove() );
			document.head.append( link );
			return loaded;
		} )
	).then( () => undefined );
}

let bootSource;

/**
 * Start downloading `@wordpress/boot`'s source, so a guest's copy is ready when it is needed.
 *
 * @return {Promise<string>} The source.
 */
export function prefetchBoot() {
	const url = importMapUrl( '@wordpress/boot' );
	if ( ! url ) {
		return Promise.reject( new Error( '@wordpress/boot is not in the import map' ) );
	}
	bootSource ??= fetch( new URL( url, location.href ) ).then( response => {
		if ( ! response.ok ) {
			throw new Error( `@wordpress/boot: HTTP ${ response.status }` );
		}
		return response.text();
	} );
	// A failed download is retried next time; the caller that awaits it sees the error.
	bootSource.catch( () => {
		bootSource = null;
	} );
	return bootSource;
}

// Any quote style: the Gutenberg plugin's minified build writes it as a template literal.
const BOOT_STORE_NAME = /(["'`])wordpress\/boot\1/g;

/**
 * Give one guest's copy of `@wordpress/boot` source its own store name.
 *
 * @param {string} source - `@wordpress/boot` module source.
 * @param {string} slug   - Guest page slug.
 * @return {string} The source with the store renamed.
 */
export function renameBootStore( source, slug ) {
	// Exactly one: a second, unrenamed copy of the name would make the apps share a store again.
	if ( source.match( BOOT_STORE_NAME )?.length !== 1 ) {
		throw new Error( '@wordpress/boot no longer names its store "wordpress/boot" exactly once' );
	}
	return source.replace( BOOT_STORE_NAME, () => JSON.stringify( `wordpress/boot--${ slug }` ) );
}

/**
 * A copy of `@wordpress/boot` for one guest app.
 *
 * Boot keeps routes in a single `wordpress/boot` store that every app renders, so a second app
 * registering `/` collides with the first. Each guest gets a copy with the store renamed.
 *
 * @param {string} slug - Guest page slug.
 * @return {Promise<object>} The boot module.
 */
export async function bootFor( slug ) {
	const source = await prefetchBoot();
	log( 'prewarm', `${ slug }: own copy of @wordpress/boot, store "wordpress/boot--${ slug }"` );
	const renamed = renameBootStore( source, slug );
	const blobUrl = URL.createObjectURL( new Blob( [ renamed ], { type: 'text/javascript' } ) );
	try {
		return await import( /* webpackIgnore: true */ blobUrl );
	} finally {
		URL.revokeObjectURL( blobUrl );
	}
}

// A static segment outranks a `$param`, which outranks the `$` splat, as TanStack ranks them.
const matchRoute = ( pattern, parts ) => {
	const score = [];
	for ( const [ i, segment ] of pattern.entries() ) {
		if ( segment === '$' ) {
			return i === pattern.length - 1 ? { score, splat: true } : null;
		}
		if ( i >= parts.length ) {
			return null;
		}
		if ( segment.startsWith( '$' ) ) {
			score.push( 1 );
		} else if ( segment.toLowerCase() === parts[ i ].toLowerCase() ) {
			score.push( 2 );
		} else {
			return null;
		}
	}
	return pattern.length === parts.length ? { score, splat: false } : null;
};

const outranks = ( a, b ) => {
	if ( a.splat !== b.splat ) {
		return b.splat;
	}
	const differs = a.score.findIndex( ( rank, i ) => rank !== b.score[ i ] );
	return differs === -1
		? a.score.length > b.score.length
		: a.score[ differs ] > ( b.score[ differs ] ?? 0 );
};

/**
 * The route boot renders for a path.
 *
 * @param {object[]} routes - wp-build routes, each with a `path` such as `/responses/$view`.
 * @param {string}   path   - The path boot reads from the `p` query argument.
 * @return {object|null} The matching route, or null when boot would show "Route not found".
 */
export function routeAt( routes, path ) {
	const parts = path.split( '/' ).filter( Boolean );
	let best = null;
	for ( const route of routes ) {
		const match = matchRoute( ( route.path ?? '' ).split( '/' ).filter( Boolean ), parts );
		if ( match && ( ! best || outranks( match, best.match ) ) ) {
			best = { route, match };
		}
	}
	return best?.route ?? null;
}

const LOADERS = Symbol.for( 'jetpack-admin-shell.route-loaders' );

/**
 * Routes whose modules boot loads through `load( id )`, so the shell decides what they are evaluated with.
 *
 * Boot imports a route's modules by ID the first time it reaches that route. Each ID becomes a
 * stand-in that awaits `load( id )` and re-exports what boot reads: `route`, `stage`, `inspector`, `canvas`.
 *
 * @param {object[]} routes - wp-build routes.
 * @param {Function} load   - Imports a module ID and resolves to the module.
 * @return {object[]} The routes, with stand-ins for their modules.
 */
export function routesLoadedBy( routes, load ) {
	const loaders = ( globalThis[ LOADERS ] ??= [] );
	const key = loaders.push( load ) - 1;
	const lookup = `globalThis[ Symbol.for( ${ JSON.stringify( LOADERS.description ) } ) ][ ${ key } ]`;
	// Never revoked: boot may first import one long after it boots, when the app reaches that route.
	const standIn = id =>
		URL.createObjectURL(
			new Blob(
				[
					`const m = await ${ lookup }( ${ JSON.stringify( id ) } );\n`,
					'export const { route, stage, inspector, canvas } = m;\n',
				],
				{ type: 'text/javascript' }
			)
		);
	return routes.map( route => ( {
		...route,
		...( route.route_module && { route_module: standIn( route.route_module ) } ),
		...( route.content_module && { content_module: standIn( route.content_module ) } ),
	} ) );
}
