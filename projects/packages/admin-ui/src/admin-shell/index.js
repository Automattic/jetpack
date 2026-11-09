/*
 * Admin shell client: switch between Jetpack wp-build dashboards without a page load.
 *
 * Each member dashboard keeps its own boot app alive. The first visit to a member fetches its
 * page data and boots its app next to the others; later visits hide and show the apps.
 * Anything that goes wrong falls back to a normal page load.
 */
/* eslint-disable import/no-unresolved -- Resolved by the import map; Admin_Shell registers each file as a module. */
import { bootFor, isolateRouters, notifyRouters } from '@automattic/jetpack-admin-shell/adapter';
import { createApp, whenRendered } from '@automattic/jetpack-admin-shell/app';
import { pageOf, updateChrome } from '@automattic/jetpack-admin-shell/chrome';
import { applyGuestAssets } from '@automattic/jetpack-admin-shell/guest-assets';
/* eslint-enable import/no-unresolved */

const CONFIG_ID = 'wp-script-module-data-@automattic/jetpack-admin-shell';
const RENDER_TIMEOUT = 15000;

const readConfig = () => {
	try {
		return JSON.parse( document.getElementById( CONFIG_ID )?.textContent ?? 'null' );
	} catch {
		return null;
	}
};

const emit = ( type, detail ) =>
	window.dispatchEvent( new CustomEvent( `jetpack-admin-shell:${ type }`, { detail } ) );

const start = ( { host, members, guestAssetsUrl } ) => {
	const hostEl = document.getElementById( members[ host ].mountId );
	if ( ! hostEl ) {
		return;
	}

	let visible = host;
	const apps = new Map();
	// Where each page was left, so its menu link reopens it there.
	const lastUrl = { [ host ]: location.href };
	const gate = isolateRouters(
		() => visible,
		() => {
			if ( pageOf( location.href ) === visible ) {
				lastUrl[ visible ] = location.href;
			}
		}
	);

	const isMemberUrl = href => {
		const url = new URL( href, location.href );
		return (
			url.origin === location.origin &&
			url.pathname === location.pathname &&
			Object.hasOwn( members, url.searchParams.get( 'page' ) ?? '' )
		);
	};

	// Pages built from one package share an init module; run each once.
	const ranInit = new Set( members[ host ].initModules );
	const warm = {};
	// Everything short of mounting: a mounted router would start reading the visible page's URL.
	const prewarm = slug =>
		( warm[ slug ] ??= ( async () => {
			await applyGuestAssets( guestAssetsUrl, slug );
			for ( const id of members[ slug ].initModules ) {
				if ( ! ranInit.has( id ) ) {
					ranInit.add( id );
					const initModule = await import( id );
					await initModule.init?.();
				}
			}
			const boot = await bootFor( slug );
			const modules = members[ slug ].routes
				.flatMap( route => [ route.route_module, route.content_module ] )
				.filter( Boolean );
			await Promise.all( modules.map( id => import( id ) ) );
			return boot;
		} )().catch( error => {
			delete warm[ slug ];
			throw error;
		} ) );

	const bootGuest = async slug => {
		// Not a div: the host page's critical CSS hides every `#wpbody-content > div` but its own app.
		const el = document.createElement( 'section' );
		el.id = members[ slug ].mountId;
		el.className = hostEl.className;
		[ ...apps.values() ].at( -1 ).el.after( el );
		const app = createApp( slug, el );
		apps.set( slug, app );
		app.place( true );

		try {
			const boot = await prewarm( slug );
			if ( visible !== slug ) {
				// Left before it could boot; it boots on the next visit, at that visit's URL.
				apps.delete( slug );
				el.remove();
				return;
			}
			gate.mount( slug );
			boot.initSinglePage( { mountId: el.id, routes: members[ slug ].routes } );
			await whenRendered( el, RENDER_TIMEOUT );
		} catch ( error ) {
			apps.delete( slug );
			el.remove();
			throw error;
		} finally {
			gate.mounted( slug );
		}

		app.to( 'ready' );
		app.place( visible === slug );
		return true;
	};

	const show = async ( url, { push } ) => {
		const slug = pageOf( url );
		const previous = visible;
		if ( slug === previous ) {
			if ( push ) {
				gate.pushUrl( url );
			}
			notifyRouters();
			return;
		}

		// Hide the outgoing app before the URL changes, so its router never sees the new URL.
		visible = slug;
		apps.get( previous )?.place( false );
		emit( 'page-hidden', { page: previous, previous: null, firstShow: false, url: location.href } );
		if ( push ) {
			gate.pushUrl( url );
		}
		updateChrome( slug, members );
		window.scrollTo( 0, 0 );

		try {
			const app = apps.get( slug );
			let firstShow = false;
			if ( app ) {
				app.place( true );
				// On Back/Forward the browser's own popstate reaches the app; a second one would re-navigate.
				if ( push ) {
					notifyRouters();
				}
			} else {
				firstShow = await bootGuest( slug );
			}
			if ( visible === slug && apps.get( slug )?.state === 'visible' ) {
				emit( 'page-shown', {
					page: slug,
					previous,
					firstShow: !! firstShow,
					url: location.href,
				} );
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console -- Shown when a switch falls back to a page load.
			console.error( 'Admin shell: falling back to a page load.', error );
			// The user may have moved on to another page while this one failed to boot.
			if ( visible === slug ) {
				location.assign( url );
			}
		}
	};

	const navigate = href => {
		const url = new URL( href, location.href );
		const slug = url.searchParams.get( 'page' );
		const bare = [ ...url.searchParams.keys() ].length === 1 && ! url.hash;
		if ( bare && slug !== visible && lastUrl[ slug ] ) {
			return show( lastUrl[ slug ], { push: true } );
		}
		if ( ! url.searchParams.has( 'p' ) && members[ slug ].defaultPath ) {
			url.searchParams.set( 'p', members[ slug ].defaultPath );
		}
		return show( url.href, { push: true } );
	};

	// Not gated: the shell itself must hear Back/Forward across pages.
	gate.listen( 'popstate', event => {
		if ( event.isTrusted && isMemberUrl( location.href ) && pageOf( location.href ) !== visible ) {
			show( location.href, { push: false } );
		}
	} );

	document.addEventListener(
		'click',
		event => {
			const a = event.target.closest?.( 'a[href]' );
			if (
				! a ||
				( a.target && a.target !== '_self' ) ||
				a.hasAttribute( 'download' ) ||
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey ||
				! isMemberUrl( a.href )
			) {
				return;
			}
			// In-app links within the visible member belong to its router.
			if ( pageOf( a.href ) === visible && ! a.closest( '#adminmenu' ) ) {
				return;
			}
			event.preventDefault();
			navigate( a.href );
		},
		true
	);

	document.getElementById( 'adminmenu' )?.addEventListener( 'pointerover', event => {
		const a = event.target.closest?.( 'a[href]' );
		if ( a && isMemberUrl( a.href ) && ! apps.has( pageOf( a.href ) ) ) {
			prewarm( pageOf( a.href ) ).catch( () => {} );
		}
	} );

	// The host boots on DOMContentLoaded, after this module runs, so its routers are tagged too.
	const hostApp = createApp( host, hostEl );
	apps.set( host, hostApp );
	gate.mount( host );
	whenRendered( hostEl, 30000 )
		.then( () => {
			hostApp.to( 'ready' );
			hostApp.place( visible === host );
			if ( visible === host ) {
				emit( 'page-shown', { page: host, previous: null, firstShow: true, url: location.href } );
			}
			// While idle, get the other members ready so their first visit is quick too.
			const idle = cb => ( window.requestIdleCallback ?? ( f => setTimeout( f, 200 ) ) )( cb );
			idle( async () => {
				for ( const slug of Object.keys( members ) ) {
					if ( ! apps.has( slug ) ) {
						await prewarm( slug ).catch( () => {} );
						await new Promise( idle );
					}
				}
			} );
		} )
		.catch( () => {} )
		.finally( () => gate.mounted( host ) );
};

const config = readConfig();
if ( config?.members?.[ config.host ] ) {
	start( config );
}
