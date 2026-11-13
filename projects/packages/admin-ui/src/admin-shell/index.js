/*
 * Admin shell client: switch between Jetpack wp-build dashboards without a page load.
 * Anything that goes wrong falls back to a normal page load.
 */
import {
	bootFor,
	isolateRouters,
	notifyRouters,
	prefetchBoot,
	trackViewTransitions,
	transitionSettled,
} from './adapter';
import { createApp, whenRendered } from './app';
import { announcePage, menuLabel, pageOf, updateChrome } from './chrome';
import { debugEnabled, log, stopwatch } from './debug';
import { applyGuestAssets } from './guest-assets';
import { configureHeaders, rememberHeader, removeHeader, showHeader } from './header';
import { closeDialogsOf, closeOverlayAround, showOverlaysOf, trackOverlays } from './overlays';

const CONFIG_ID = 'wp-script-module-data-@automattic/jetpack-admin-shell';
const RENDER_TIMEOUT = 15000;
const INIT_TIMEOUT = 15000;

const readConfig = () => {
	try {
		return JSON.parse( document.getElementById( CONFIG_ID )?.textContent ?? 'null' );
	} catch {
		return null;
	}
};

const emit = ( type, detail ) => {
	log( 'shell', `event jetpack-admin-shell:${ type }`, detail );
	window.dispatchEvent( new CustomEvent( `jetpack-admin-shell:${ type }`, { detail } ) );
};

const start = ( { host, members, guestAssetsUrl, headerStorageKey } ) => {
	const hostEl = document.getElementById( members[ host ].mountId );
	if ( ! hostEl ) {
		return;
	}
	// The title the host page was printed with, filters included.
	members[ host ].adminTitle = document.title;
	configureHeaders( headerStorageKey, members );
	trackViewTransitions();
	// A member declares the header of the view its bare menu link opens; other views only get a title.
	const showHeaderAt = ( slug, el, url ) => {
		const { header, defaultPath, title } = members[ slug ];
		const path = new URL( url, location.href ).searchParams.get( 'p' ) ?? '/';
		const landing = [ '/', defaultPath ].includes( path );
		return showHeader( slug, el, menuLabel( slug ) ?? title, landing ? header : null );
	};

	log(
		'shell',
		`started on ${ host }; members: ${ Object.keys( members ).join( ', ' ) }`,
		members
	);
	let visible = host;
	const apps = new Map();
	// Where each page was left, so its menu link reopens it there, and how far it was scrolled.
	const lastUrl = { [ host ]: location.href };
	const scrollOf = {};
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
			Object.hasOwn( members, pageOf( url ) ?? '' )
		);
	};

	// Pages built from one package share an init module; run each once.
	const ranInit = new Set( members[ host ].initModules );
	/*
	 * One guest's init and route-module imports at a time: an init sets globals such as
	 * `window.jetpackConfig` that its route modules read when they are evaluated.
	 */
	let booting = Promise.resolve();
	const oneAtATime = task => {
		const run = booting.then( task );
		booting = run.catch( () => {} );
		return run;
	};
	const warm = {};
	// Everything short of mounting: a mounted router would start reading the visible page's URL.
	const prewarm = ( slug, reason ) => {
		if ( warm[ slug ] ) {
			return warm[ slug ];
		}
		const total = stopwatch();
		log( 'prewarm', `${ slug }: start (${ reason })` );
		prefetchBoot().catch( () => {} ); // Download in parallel; bootFor() reports a failure.
		warm[ slug ] = ( async () => {
			let step = stopwatch();
			const added = await applyGuestAssets( guestAssetsUrl, slug );
			log( 'prewarm', `${ slug }: page data fetched and applied in ${ step() }`, added );
			return oneAtATime( async () => {
				for ( const id of members[ slug ].initModules ) {
					if ( ! ranInit.has( id ) ) {
						step = stopwatch();
						// Not bundled: wp-build's modules resolve through the page's import map at runtime.
						const initModule = await import( /* webpackIgnore: true */ id );
						/*
						 * Bounded, so a hung init can't hold up every guest queued behind it. A timed-out init
						 * may still finish later and set its globals; it runs again on the next attempt.
						 */
						let timer;
						await Promise.race( [
							initModule.init?.(),
							new Promise( ( resolve, reject ) => {
								timer = setTimeout(
									() => reject( new Error( `Admin shell: ${ id } timed out` ) ),
									INIT_TIMEOUT
								);
							} ),
						] ).finally( () => clearTimeout( timer ) );
						// Only once it succeeded, so a failed init runs again on the next attempt.
						ranInit.add( id );
						log( 'prewarm', `${ slug }: ran ${ id } in ${ step() }` );
					}
				}
				const boot = await bootFor( slug );
				const modules = members[ slug ].routes
					.flatMap( route => [ route.route_module, route.content_module ] )
					.filter( Boolean );
				step = stopwatch();
				await Promise.all( modules.map( id => import( /* webpackIgnore: true */ id ) ) );
				log(
					'prewarm',
					`${ slug }: imported ${ modules.length } route modules in ${ step() }`,
					modules
				);
				log( 'prewarm', `${ slug }: ready to boot, ${ total() } in all` );
				return boot;
			} );
		} )().catch( error => {
			log( 'prewarm', `${ slug }: failed after ${ total() }`, error );
			delete warm[ slug ];
			throw error;
		} );
		return warm[ slug ];
	};

	// Once an app's first route is on screen.
	const markReady = app => {
		app.to( 'ready' );
		app.place( visible === app.slug );
		rememberHeader( app.slug, app.el );
		// Tab bars and actions often render just after the heading.
		setTimeout( () => visible === app.slug && rememberHeader( app.slug, app.el ), 1000 );
	};

	const bootGuest = async ( slug, url ) => {
		// Not a div: the host page's critical CSS hides every `#wpbody-content > div` but its own app.
		const el = document.createElement( 'section' );
		el.id = members[ slug ].mountId;
		el.className = hostEl.className;
		[ ...apps.values() ].at( -1 ).el.after( el );
		const app = createApp( slug, el );
		apps.set( slug, app );
		const discard = () => {
			apps.delete( slug );
			el.remove();
		};
		const removeStandIn = showHeaderAt( slug, el, url );

		try {
			const waited = stopwatch();
			const boot = await prewarm( slug, 'switch' );
			log( 'switch', `${ slug }: waited ${ waited() } for prewarm` );
			if ( visible !== slug ) {
				// Left before it could boot; it boots on the next visit, at that visit's URL.
				log( 'switch', `${ slug }: left before it booted` );
				removeStandIn();
				discard();
				return;
			}
			gate.mount( slug );
			const render = stopwatch();
			log( 'switch', `${ slug }: initSinglePage into #${ el.id }` );
			boot.initSinglePage( { mountId: el.id, routes: members[ slug ].routes } );
			await whenRendered( el, RENDER_TIMEOUT );
			log( 'switch', `${ slug }: first route rendered ${ render() } after boot` );
		} catch ( error ) {
			discard();
			throw error;
		} finally {
			removeStandIn();
			gate.mounted( slug );
		}
		markReady( app );
	};

	const show = async ( url, { push, via } ) => {
		const slug = pageOf( url );
		const previous = visible;
		if ( slug === previous ) {
			log( 'switch', `${ via }: already on ${ slug }, only the URL changes` );
			if ( push ) {
				gate.pushUrl( url );
			}
			notifyRouters();
			return;
		}

		const elapsed = stopwatch();
		log( 'switch', `${ via }: ${ previous } → ${ slug }`, url );
		if ( apps.get( previous )?.state === 'visible' ) {
			rememberHeader( previous, apps.get( previous ).el );
			scrollOf[ previous ] = window.scrollY;
		}
		// Hide the outgoing app before the URL changes, so its router never sees the new URL.
		visible = slug;
		if ( apps.get( previous )?.state === 'loading' ) {
			removeHeader( previous );
		}
		apps.get( previous )?.place( false );
		const dialogsClosed = closeDialogsOf( previous );
		showOverlaysOf( slug );
		emit( 'page-hidden', { page: previous, previous: null, firstShow: false, url: location.href } );
		if ( push ) {
			gate.pushUrl( url );
		}
		updateChrome( slug, members );

		try {
			const app = apps.get( slug );
			if ( app ) {
				log( 'switch', `${ slug } is already booted, showing it` );
				app.place( true );
				window.scrollTo( 0, scrollOf[ slug ] ?? 0 );
				// On Back/Forward the browser's own popstate reaches the app; a second one would re-navigate.
				if ( push ) {
					notifyRouters();
				}
			} else {
				log( 'switch', `${ slug } has not booted yet` );
				window.scrollTo( 0, 0 );
				await bootGuest( slug, url );
			}
			// Focus and speech inside a closing modal's `aria-hidden` would go unheard.
			await dialogsClosed;
			if ( visible === slug && apps.get( slug )?.state === 'visible' ) {
				log(
					'switch',
					`${ slug } on screen ${ elapsed() } after the switch started`,
					location.search
				);
				apps.get( slug ).focusHeading();
				announcePage( members[ slug ].adminTitle );
				emit( 'page-shown', {
					page: slug,
					previous,
					firstShow: ! app,
					url: location.href,
				} );
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console -- Shown when a switch falls back to a page load.
			console.error( 'Admin shell: falling back to a page load.', error );
			// The user may have moved on to another page while this one failed to boot.
			if ( visible === slug ) {
				log( 'switch', `${ slug }: falling back to a page load` );
				// Replace: the shell has already pushed this URL. Only its query and hash come from the link.
				const target = new URL( location.pathname, location.origin );
				const { search, hash } = new URL( url, location.href );
				Object.assign( target, { search, hash } );
				location.replace( target.href );
			}
		}
	};

	const navigate = ( href, via ) => {
		const url = new URL( href, location.href );
		const slug = pageOf( url );
		const bare = [ ...url.searchParams.keys() ].length === 1 && ! url.hash;
		if ( bare && slug !== visible && lastUrl[ slug ] ) {
			log( 'switch', `bare menu link: reopening ${ slug } where it was left` );
			return show( lastUrl[ slug ], { push: true, via } );
		}
		if ( ! url.searchParams.has( 'p' ) && members[ slug ].defaultPath ) {
			url.searchParams.set( 'p', members[ slug ].defaultPath );
		}
		return show( url.href, { push: true, via } );
	};

	// Not gated: the shell itself must hear Back/Forward across pages.
	gate.listen( 'popstate', event => {
		if ( event.isTrusted && isMemberUrl( location.href ) && pageOf( location.href ) !== visible ) {
			if ( gate.isMounting() ) {
				location.reload();
				return;
			}
			show( location.href, { push: false, via: 'back/forward' } );
		}
	} );

	// Bubble phase: an app that handles a link itself (preventDefault) keeps it.
	document.addEventListener( 'click', event => {
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
		const inMenu = !! a.closest( '#adminmenu' );
		if ( pageOf( a.href ) === visible && ! inMenu ) {
			return;
		}
		// While an app mounts, routers set up now are tagged as its; a page load can't mix them up.
		if ( gate.isMounting() ) {
			log( 'switch', 'an app is still mounting: letting the link load the page' );
			return;
		}
		event.preventDefault();
		closeOverlayAround( a )
			.then( closed => closed && transitionSettled() )
			.then( () => navigate( a.href, inMenu ? 'menu click' : 'link click' ) );
	} );

	document.getElementById( 'adminmenu' )?.addEventListener( 'pointerover', event => {
		const a = event.target.closest?.( 'a[href]' );
		if ( a && isMemberUrl( a.href ) && ! apps.has( pageOf( a.href ) ) ) {
			prewarm( pageOf( a.href ), 'menu hover' ).catch( () => {} );
		}
	} );

	// The host boots on DOMContentLoaded, after this module runs, so its routers are tagged too.
	trackOverlays( () => visible );
	const hostApp = createApp( host, hostEl );
	apps.set( host, hostApp );
	const removeHostHeader = showHeaderAt( host, hostEl, location.href );
	gate.mount( host );
	log( 'host', `${ host } boots from the page load` );
	whenRendered( hostEl, 30000 )
		.then( () => {
			log( 'host', `${ host } rendered its first route` );
			removeHostHeader();
			markReady( hostApp );
			if ( visible === host ) {
				emit( 'page-shown', { page: host, previous: null, firstShow: true, url: location.href } );
			}
		} )
		.catch( error => {
			removeHostHeader();
			log( 'host', `${ host } did not render`, error );
		} )
		.finally( () => gate.mounted( host ) );

	if ( debugEnabled ) {
		window.jetpackAdminShell = {
			apps,
			members,
			get visible() {
				return visible;
			},
		};
		log( 'shell', 'inspect it with window.jetpackAdminShell' );
	}
};

const config = readConfig();
if ( config?.members?.[ config.host ] ) {
	start( config );
} else {
	log( 'shell', 'no config on this page, staying off', config );
}
