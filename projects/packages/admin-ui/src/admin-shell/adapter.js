/*
 * Every workaround for @wordpress/boot and TanStack Router internals lives here, so when
 * Gutenberg ships APIs for several apps in one document only this file changes (JETPACK-3414).
 */
import { log } from '@automattic/jetpack-admin-shell/debug'; // eslint-disable-line import/no-unresolved -- Resolved by the import map.

/**
 * Keep each app's router deaf to URLs that belong to another app.
 *
 * Routers subscribe to `popstate`/`hashchange` and wrap `history.pushState`/`replaceState`.
 * Whatever an app adds while it mounts is tagged with that app and only runs while it is visible.
 *
 * @param {Function} getVisible - Returns the slug of the app on screen.
 * @param {Function} onWrite    - Called after every history write reaches the browser.
 * @return {object} `mount( slug )`, `mounted( slug )`, `listen( type, listener )` and `pushUrl( url )`.
 */
export function isolateRouters( getVisible, onWrite ) {
	let mounting = null;

	const listen = window.addEventListener.bind( window );
	const unlisten = window.removeEventListener.bind( window );
	const gated = new WeakMap();
	window.addEventListener = ( type, listener, options ) => {
		if ( mounting && listener && ( type === 'popstate' || type === 'hashchange' ) ) {
			const owner = mounting;
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
				wrappers.push( { fn, owner: mounting } );
				log( 'router', `${ mounting ?? 'unknown code' } wrapped history.${ method }` );
			},
		} );
	}

	return {
		mount: slug => {
			mounting = slug;
			log( 'router', `tagging routers that subscribe now as ${ slug }'s` );
		},
		// Routers subscribe in effects shortly after the first render, so keep the window open a little.
		mounted: slug =>
			setTimeout( () => {
				if ( mounting === slug ) {
					mounting = null;
					log( 'router', `stopped tagging for ${ slug }` );
				}
			}, 1000 ),
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
	};
}

/**
 * Tell the visible app's router to read the URL again.
 */
export function notifyRouters() {
	log( 'router', 'synthetic popstate so the visible router reads the URL' );
	window.dispatchEvent( new PopStateEvent( 'popstate', { state: history.state } ) );
}

const importMapUrl = id =>
	[ ...document.querySelectorAll( 'script[type="importmap"]' ) ]
		.map( el => JSON.parse( el.textContent ).imports?.[ id ] )
		.find( Boolean );

let bootSource;

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
	const url = importMapUrl( '@wordpress/boot' );
	if ( ! url ) {
		throw new Error( '@wordpress/boot is not in the import map' );
	}
	bootSource ??= fetch( new URL( url, location.href ) ).then( response => {
		if ( ! response.ok ) {
			throw new Error( `@wordpress/boot: HTTP ${ response.status }` );
		}
		return response.text();
	} );
	const source = await bootSource;
	log( 'prewarm', `${ slug }: own copy of @wordpress/boot, store "wordpress/boot--${ slug }"` );
	if ( ! source.includes( '"wordpress/boot"' ) ) {
		throw new Error( '@wordpress/boot no longer names its store "wordpress/boot"' );
	}
	const renamed = source.replace(
		'"wordpress/boot"',
		JSON.stringify( `wordpress/boot--${ slug }` )
	);
	return import( URL.createObjectURL( new Blob( [ renamed ], { type: 'text/javascript' } ) ) );
}
