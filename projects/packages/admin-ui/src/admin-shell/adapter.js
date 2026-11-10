/*
 * Every workaround for @wordpress/boot and TanStack Router internals lives here, so when
 * Gutenberg ships APIs for several apps in one document only this file changes (JETPACK-3414).
 */
/* eslint-disable import/no-unresolved -- Resolved by the import map. */
import { pageOf } from '@automattic/jetpack-admin-shell/chrome';
import { log } from '@automattic/jetpack-admin-shell/debug';
/* eslint-enable import/no-unresolved */

/**
 * Keep each app's router deaf to URLs that belong to another app.
 *
 * Routers subscribe to `popstate`/`hashchange` and wrap `history.pushState`/`replaceState`.
 * Whatever an app adds while it mounts is tagged with that app and only runs while it is visible.
 *
 * @param {Function} getVisible - Returns the slug of the app on screen.
 * @param {Function} onWrite    - Called after every history write reaches the browser.
 * @return {object} `mount( slug )`, `mounted( slug )`, `isMounting()`, `listen( type, listener )` and `pushUrl( url )`.
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
	};
}

let activeTransition = null;

/**
 * Keep view transitions from erroring when one app's transition cuts off another's.
 *
 * Boot animates every route change, and a document runs one transition at a time, so two apps
 * navigating close together skip the first one. Nobody awaits its promises, so the skip would
 * surface as an unhandled "Transition was skipped" error.
 */
export function trackViewTransitions() {
	if ( typeof document.startViewTransition !== 'function' ) {
		return;
	}
	const start = document.startViewTransition.bind( document );
	document.startViewTransition = ( ...args ) => {
		const transition = start( ...args );
		for ( const promise of [
			transition.ready,
			transition.finished,
			transition.updateCallbackDone,
		] ) {
			promise?.catch( () => {} );
		}
		activeTransition = transition;
		transition.finished
			.catch( () => {} )
			.then( () => {
				if ( activeTransition === transition ) {
					activeTransition = null;
				}
			} );
		return transition;
	};
}

/**
 * Wait for a running view transition to finish, so the next navigation doesn't cut it off.
 *
 * @param {number} timeout - Milliseconds to wait at most.
 * @return {Promise<void>} Resolves when no transition is running.
 */
export function transitionSettled( timeout = 500 ) {
	if ( ! activeTransition ) {
		return Promise.resolve();
	}
	return Promise.race( [
		activeTransition.finished.catch( () => {} ),
		new Promise( resolve => setTimeout( resolve, timeout ) ),
	] ).then( () => undefined );
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
	// Exactly one: a second, unrenamed copy of the name would make the apps share a store again.
	if ( source.split( '"wordpress/boot"' ).length !== 2 ) {
		throw new Error( '@wordpress/boot no longer names its store "wordpress/boot" exactly once' );
	}
	const renamed = source.replace(
		'"wordpress/boot"',
		JSON.stringify( `wordpress/boot--${ slug }` )
	);
	const blobUrl = URL.createObjectURL( new Blob( [ renamed ], { type: 'text/javascript' } ) );
	try {
		return await import( blobUrl );
	} finally {
		URL.revokeObjectURL( blobUrl );
	}
}
