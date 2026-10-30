// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Evaluated by the PHP loader as a function expression.
config => {
	const members = config.members;
	const apps = {};
	const frames = {};
	let visible = config.host;

	const pageOf = url => new URL( url, location.href ).searchParams.get( 'page' );

	// Routers listen on window, so a hidden app would otherwise read (and route to) another page's URL.
	// Listeners added while an app mounts only hear popstate/hashchange while that app is shown.
	let mounting = null;
	const listen = window.addEventListener.bind( window );
	const unlisten = window.removeEventListener.bind( window );
	const gated = new WeakMap();
	window.addEventListener = ( type, listener, options ) => {
		if ( mounting && listener && ( type === 'popstate' || type === 'hashchange' ) ) {
			const owner = mounting;
			if ( ! gated.has( listener ) ) {
				gated.set( listener, event => {
					if ( owner === visible ) {
						return typeof listener === 'function'
							? listener.call( window, event )
							: listener.handleEvent( event );
					}
				} );
			}
			return listen( type, gated.get( listener ), options );
		}
		return listen( type, listener, options );
	};
	window.removeEventListener = ( type, listener, options ) =>
		unlisten( type, ( listener && gated.get( listener ) ) || listener, options );
	const startMounting = page => {
		mounting = page;
	};
	// Routers subscribe in effects shortly after the app's first render.
	const finishMounting = page =>
		setTimeout( () => {
			if ( mounting === page ) {
				mounting = null;
			}
		}, 1000 );
	// The host boots on DOMContentLoaded; this listener is added first, so it runs first.
	document.addEventListener( 'DOMContentLoaded', () => {
		startMounting( config.host );
		const host = document.getElementById( members[ config.host ].mountId );
		const done = () => {
			watchHost.disconnect();
			finishMounting( config.host );
		};
		const watchHost = new MutationObserver(
			() => headerOf( host )?.querySelector( 'h1' ) && done()
		);
		watchHost.observe( host, { childList: true, subtree: true } );
		setTimeout( done, 8000 );
	} );

	// A same-document admin page the shell can show: a member app, or another menu page kept in a frame.
	const kindOf = url => {
		const u = new URL( url, location.href );
		const page = u.searchParams.get( 'page' );
		if ( u.origin !== location.origin || u.pathname !== location.pathname || ! page ) {
			return null;
		}
		// Hash routers (My Jetpack, Settings) keep their route in the hash, so it stays in the app.
		if ( members[ page ] ) {
			return 'app';
		}
		if ( u.hash ) {
			return null;
		}
		const inMenu = document.querySelector(
			`#adminmenu a[href$="page=${ CSS.escape( page ) }"], #adminmenu a[href*="page=${ CSS.escape( page ) }&"]`
		);
		return inMenu && ! config.frameExclusions.includes( page ) ? 'frame' : null;
	};

	const highlightMenu = page => {
		const link = [ ...document.querySelectorAll( '#adminmenu .wp-submenu a, #adminmenu a' ) ].find(
			a => pageOf( a.href ) === page && ! new URL( a.href, location.href ).hash
		);
		if ( ! link ) {
			return;
		}
		const top = link.closest( 'li.menu-top' );
		document.querySelectorAll( '#adminmenu li.menu-top' ).forEach( li => {
			const on = li === top;
			const hasSub = li.classList.contains( 'wp-has-submenu' );
			li.classList.toggle( hasSub ? 'wp-has-current-submenu' : 'current', on );
			li.classList.toggle( 'wp-menu-open', on && hasSub );
			li.classList.toggle( 'wp-not-current-submenu', hasSub && ! on );
			li.querySelector( ':scope > a' )?.classList.toggle(
				hasSub ? 'wp-has-current-submenu' : 'current',
				on
			);
		} );
		document.querySelectorAll( '#adminmenu .wp-submenu li' ).forEach( li => {
			const on = li.contains( link );
			li.classList.toggle( 'current', on );
			li.querySelector( 'a' )?.classList.toggle( 'current', on );
			li.querySelector( 'a' )?.toggleAttribute( 'aria-current', on );
		} );
	};

	const highlight = page => {
		// Dashboards scope their layout styles to WordPress's per-page body class.
		for ( const member of Object.keys( members ) ) {
			document.body.classList.toggle( 'jetpack_page_' + member, member === page );
		}
		highlightMenu( page );
		const title =
			members[ page ]?.title || frames[ page ]?.contentDocument?.title.split( ' ‹' )[ 0 ];
		if ( title ) {
			document.title = document.title.replace( /^[^‹]*/, title + ' ' );
		}
	};

	const runInit = async ids => {
		for ( const id of ids ) {
			try {
				const initModule = await import( id );
				if ( typeof initModule.init === 'function' ) {
					await initModule.init();
				}
			} catch ( error ) {
				console.warn( 'Admin shell: init failed', id, error ); // eslint-disable-line no-console
			}
		}
	};
	const ranInit = new Set( members[ config.host ].initModules );

	// Core's boot keeps routes in one `wordpress/boot` store that every app renders, so two apps
	// registering `/` collide. Each guest app gets its own copy of boot with a renamed store.
	const importMaps = () =>
		[ ...document.querySelectorAll( 'script[type="importmap"]' ) ].map(
			el => JSON.parse( el.textContent ).imports ?? {}
		);
	const moduleUrl = id =>
		importMaps()
			.map( imports => imports[ id ] )
			.find( Boolean );

	let bootSource;
	const bootModuleFor = async page => {
		bootSource ??= fetch( new URL( moduleUrl( '@wordpress/boot' ), location.href ) ).then( r =>
			r.text()
		);
		const source = ( await bootSource ).replace(
			'"wordpress/boot"',
			JSON.stringify( 'wordpress/boot--' + page )
		);
		return import( URL.createObjectURL( new Blob( [ source ], { type: 'text/javascript' } ) ) );
	};

	// A guest's page data (initial state, REST preloads, its own classic scripts) is fetched when
	// it is first needed instead of being built on every member page.
	const guestAssets = {};
	const fetchGuestAssets = page => {
		const url = new URL( config.guestAssetsUrl, location.href );
		// Not `page`: products treat a `page` naming them as a visit to their own screen.
		url.searchParams.set( 'member', page );
		guestAssets[ page ] ??= fetch( url, { credentials: 'same-origin' } )
			.then( r => r.json() )
			.then( r => ( r.success ? r.data.html : '' ) )
			.catch( () => '' );
		return guestAssets[ page ];
	};

	const isPlainObject = v => v && typeof v === 'object' && ! Array.isArray( v );
	const mergeInto = ( target, source ) => {
		for ( const [ key, value ] of Object.entries( source ) ) {
			if ( isPlainObject( value ) && isPlainObject( target[ key ] ) ) {
				mergeInto( target[ key ], value );
			} else if ( ! ( key in target ) ) {
				target[ key ] = value;
			}
		}
	};

	const runScript = node =>
		new Promise( resolve => {
			const script = document.createElement( 'script' );
			for ( const { name, value } of node.attributes ) {
				script.setAttribute( name, value );
			}
			if ( node.src ) {
				script.async = false;
				script.onload = script.onerror = resolve;
			} else {
				script.textContent = node.textContent;
			}
			document.head.append( script );
			if ( ! node.src ) {
				resolve();
			}
		} );

	const applyGuestAssets = async page => {
		const template = document.createElement( 'template' );
		template.innerHTML = await fetchGuestAssets( page );
		// Script modules are already in this page's import map; a second map would be ignored anyway.
		const nodes = template.content.querySelectorAll(
			'link[rel="stylesheet"], style, script:not([type="importmap"]):not([type="module"])'
		);
		for ( const node of nodes ) {
			const existing = node.id && document.getElementById( node.id );
			if ( node.tagName !== 'SCRIPT' ) {
				if ( ! existing ) {
					document.head.append( node.cloneNode( true ) );
				}
				continue;
			}
			if ( node.src ? existing : existing?.textContent === node.textContent ) {
				continue;
			}
			if ( node.id === 'jetpack-script-data-js-before' && window.JetpackScriptData ) {
				// Keep the host's JetpackScriptData and add the guest's keys to it.
				const host = window.JetpackScriptData;
				await runScript( node );
				const guest = window.JetpackScriptData;
				window.JetpackScriptData = host;
				mergeInto( host, guest );
				continue;
			}
			await runScript( node );
		}
	};

	// Everything short of mounting: a hidden app's router would rewrite the visible page's URL.
	const warm = {};
	const prewarm = page =>
		( warm[ page ] ??= ( async () => {
			const m = members[ page ];
			await applyGuestAssets( page );
			// Pages built from one package share an init module; run each once.
			const pending = m.initModules.filter( id => ! ranInit.has( id ) );
			pending.forEach( id => ranInit.add( id ) );
			await runInit( pending );
			const boot = await bootModuleFor( page );
			const ids = m.routes.flatMap( r => [ r.route_module, r.content_module ] ).filter( Boolean );
			await Promise.all( ids.map( id => import( id ).catch( () => {} ) ) );
			return boot;
		} )() );

	// A page's header (and tab bar) is kept from its last render and shown the moment it is opened.
	const SNAPSHOT_KEY = 'jetpack-admin-shell-header:';
	const headerOf = root => root.querySelector( '.admin-ui-navigable-region > [class*="__header"]' );
	const readSnapshot = page => {
		try {
			return localStorage.getItem( SNAPSHOT_KEY + page );
		} catch {
			return null;
		}
	};
	const saveSnapshot = ( page, root ) => {
		const header = headerOf( root );
		if ( ! header?.querySelector( 'h1' )?.textContent.trim() ) {
			return;
		}
		const keep = [
			header,
			root.querySelector( '[role="tablist"], .components-tab-panel__tabs' ),
		].filter( Boolean );
		keep.forEach( el => el.setAttribute( 'data-shell-keep', '' ) );
		const clone = root.cloneNode( true );
		keep.forEach( el => el.removeAttribute( 'data-shell-keep' ) );
		const prune = el => {
			for ( const child of [ ...el.children ] ) {
				if ( child.hasAttribute( 'data-shell-keep' ) ) {
					continue;
				}
				if ( child.querySelector( '[data-shell-keep]' ) ) {
					prune( child );
				} else {
					child.remove();
				}
			}
		};
		prune( clone );
		clone.querySelectorAll( '[id]' ).forEach( el => el.removeAttribute( 'id' ) );
		try {
			localStorage.setItem( SNAPSHOT_KEY + page, clone.innerHTML );
		} catch {
			// Storage can be unavailable (private mode, blocked site data).
		}
	};
	// Never opened in this browser: borrow another page's header and put this page's title in it.
	const fallbackSnapshot = page => {
		const template = document.createElement( 'div' );
		template.innerHTML = Object.keys( members ).map( readSnapshot ).find( Boolean ) ?? '';
		const header = headerOf( template );
		if ( ! header ) {
			return '';
		}
		const prune = el => {
			for ( const child of [ ...el.children ] ) {
				child.contains( header ) ? child !== header && prune( child ) : child.remove();
			}
		};
		prune( template );
		header.querySelector( '[class*="__header-actions"]' )?.remove();
		header.querySelector( ':scope > p' )?.remove();
		header.querySelector( 'h1' ).textContent = members[ page ].title;
		return template.innerHTML;
	};

	const placeholders = {};
	const ready = { [ config.host ]: true };
	const bootApp = async page => {
		const m = members[ page ];
		const host = document.getElementById( members[ config.host ].mountId );
		const el = document.createElement( 'section' );
		el.id = m.mountId;
		el.className = 'boot-layout-container';
		host.after( el );
		apps[ page ] = el;

		const placeholder = document.createElement( 'section' );
		placeholder.className = 'boot-layout-container jetpack-admin-shell-placeholder';
		placeholder.inert = true;
		placeholder.innerHTML = readSnapshot( page ) ?? fallbackSnapshot( page );
		host.after( placeholder );
		placeholders[ page ] = placeholder;

		const markReady = () => {
			if ( ready[ page ] ) {
				return;
			}
			watch.disconnect();
			finishMounting( page );
			ready[ page ] = true;
			placeholder.remove();
			delete placeholders[ page ];
			if ( visible === page ) {
				reveal( page );
			}
		};
		// Pages without the standard header are shown once they render anything substantial.
		const watch = new MutationObserver( () => {
			if (
				headerOf( el )?.querySelector( 'h1' )?.textContent.trim() ||
				el.textContent.trim().length > 300
			) {
				markReady();
			}
		} );
		setTimeout( markReady, 6000 );
		watch.observe( el, { childList: true, subtree: true, characterData: true } );

		const { initSinglePage } = await prewarm( page );
		startMounting( page );
		initSinglePage( { mountId: m.mountId, routes: m.routes } );
	};

	const frameUrl = url => {
		const u = new URL( url, location.href );
		u.searchParams.set( 'jetpack_shell_frame', '1' );
		return u.href;
	};

	// A framed page that sets its own hash on load (Stats) adds an entry to the tab's history, so Back
	// would step through the hidden frame. Preloads start at the URL the frame last settled on instead.
	const FRAME_URL_KEY = 'jetpack-admin-shell-frame:';
	const rememberedFrameUrl = page => {
		try {
			return localStorage.getItem( FRAME_URL_KEY + page );
		} catch {
			return null;
		}
	};
	const rememberFrameUrl = ( page, iframe ) => {
		try {
			const href = iframe.contentWindow.location.href;
			if ( pageOf( href ) === page ) {
				localStorage.setItem( FRAME_URL_KEY + page, href );
			}
		} catch {
			// Storage can be unavailable (private mode, blocked site data).
		}
	};

	const loadFrame = ( page, url ) => {
		if ( frames[ page ] ) {
			return frames[ page ];
		}
		const iframe = document.createElement( 'iframe' );
		iframe.className = 'jetpack-admin-shell-frame';
		iframe.title = page;
		// Laid out but invisible while hidden, so framed charts measure a real width.
		iframe.style.cssText = 'visibility:hidden;position:fixed;border:0;z-index:1;background:#fff';
		iframe.src = frameUrl( url );
		iframe.addEventListener( 'load', () => {
			setTimeout( () => rememberFrameUrl( page, iframe ), 1500 );
			iframe.contentWindow.addEventListener( 'hashchange', () => rememberFrameUrl( page, iframe ) );
		} );
		document.getElementById( 'wpbody-content' ).append( iframe );
		placeFrame( iframe );
		frames[ page ] = iframe;
		return iframe;
	};

	const placeFrame = iframe => {
		const r = document.getElementById( 'wpcontent' ).getBoundingClientRect();
		const top = document.getElementById( 'wpadminbar' )?.offsetHeight ?? 0;
		Object.assign( iframe.style, {
			top: top + 'px',
			left: r.left + 'px',
			width: r.width + 'px',
			height: innerHeight - top + 'px',
		} );
	};

	// Only the visible app's router hears this; it re-reads `?p=` or the hash.
	const notifyRouters = () =>
		dispatchEvent( new PopStateEvent( 'popstate', { state: history.state } ) );

	// While a page first mounts, its own hash writes are trusted (that is how hash routers are found).
	let bootingUntil = Date.now() + 5000;
	// Modals, popovers and snackbars render into <body>, outside their app, so they follow its visibility.
	const portalOwners = new Map();
	const watchPortals = () =>
		new MutationObserver( records => {
			for ( const record of records ) {
				for ( const node of record.addedNodes ) {
					if (
						node.nodeType === 1 &&
						! [ 'SCRIPT', 'STYLE', 'LINK' ].includes( node.tagName ) &&
						! portalOwners.has( node )
					) {
						portalOwners.set( node, visible );
					}
				}
			}
		} ).observe( document.body, { childList: true } );
	// This script runs in <head>, before <body> exists.
	if ( document.body ) {
		watchPortals();
	} else {
		document.addEventListener( 'DOMContentLoaded', watchPortals );
	}

	const reveal = page => {
		for ( const [ node, owner ] of portalOwners ) {
			if ( ! node.isConnected ) {
				portalOwners.delete( node );
			} else if ( owner !== page && node.style.display !== 'none' ) {
				node.dataset.shellDisplay = node.style.display;
				node.style.display = 'none';
			} else if ( owner === page && 'shellDisplay' in node.dataset ) {
				node.style.display = node.dataset.shellDisplay;
				delete node.dataset.shellDisplay;
			}
		}
		for ( const [ slug, el ] of Object.entries( apps ) ) {
			el.style.display = slug === page && ready[ slug ] ? '' : 'none';
		}
		for ( const [ slug, el ] of Object.entries( placeholders ) ) {
			el.style.display = slug === page ? '' : 'none';
		}
		for ( const [ slug, el ] of Object.entries( frames ) ) {
			el.style.visibility = slug === page ? 'visible' : 'hidden';
		}
		visible = page;
		highlight( page );
		// After Back/Forward, focus would otherwise keep the previous page's menu link lit.
		// eslint-disable-next-line @wordpress/no-global-active-element -- The shell owns the whole document.
		const focused = document.activeElement;
		if ( focused?.closest?.( '#adminmenu' ) && focused.href && pageOf( focused.href ) !== page ) {
			focused.blur();
		}
		if ( ready[ page ] && apps[ page ] ) {
			setTimeout( () => visible === page && saveSnapshot( page, apps[ page ] ), 1000 );
		}
	};

	const show = async url => {
		const kind = kindOf( url );
		if ( ! kind ) {
			location.href = url;
			return;
		}
		const page = pageOf( url );
		if ( kind === 'frame' ) {
			placeFrame( loadFrame( page, url ) );
			reveal( page );
			return;
		}
		apps[ config.host ] ??= document.getElementById( members[ config.host ].mountId );
		if ( apps[ page ] ) {
			reveal( page );
			notifyRouters();
			return;
		}
		bootingUntil = Date.now() + 3000;
		const booting = bootApp( page );
		reveal( page );
		await booting;
	};

	const navigate = href => {
		const url = new URL( href, location.href );
		const kind = kindOf( url );
		if ( ! kind ) {
			location.href = url.href;
			return;
		}
		const page = url.searchParams.get( 'page' );
		const bare = [ ...url.searchParams.keys() ].length === 1 && ! url.hash;
		if ( bare && page !== visible && lastUrl[ page ] ) {
			const index = ( history.state?.__TSR_index ?? 0 ) + 1;
			history.pushState( { ...history.state, __TSR_index: index }, '', lastUrl[ page ] );
			show( lastUrl[ page ] );
			return;
		}
		if ( kind === 'app' && ! url.searchParams.has( 'p' ) && members[ page ].defaultPath ) {
			url.searchParams.set( 'p', members[ page ].defaultPath );
		}
		const index = ( history.state?.__TSR_index ?? 0 ) + 1;
		const key = Math.random().toString( 36 ).slice( 2 );
		history.pushState( { __TSR_index: index, key, __TSR_key: key }, '', url );
		if ( page === visible && kind === 'app' ) {
			notifyRouters();
		} else {
			show( url.href );
		}
		window.scrollTo( 0, 0 );
	};
	window.jetpackAdminShell = { navigate };

	// Remember where each page was left; as a backstop, stop hidden hash routers (My Jetpack, Settings)
	// from rewriting the visible page's hash.
	const lastUrl = { [ config.host ]: location.href };
	const hashApps = new Set();
	for ( const method of [ 'pushState', 'replaceState' ] ) {
		const original = history[ method ].bind( history );
		const base = ( state, unused, url ) => {
			const next =
				url === undefined || url === null ? location.href : new URL( url, location.href ).href;
			const hashOnly =
				next.split( '#' )[ 0 ] === location.href.split( '#' )[ 0 ] && next !== location.href;
			if ( hashOnly && Date.now() < bootingUntil ) {
				hashApps.add( visible );
			} else if ( hashOnly && ! hashApps.has( visible ) ) {
				return;
			}
			original( state, unused, url );
			if ( pageOf( location.href ) === visible ) {
				lastUrl[ visible ] = location.href;
			}
		};
		// TanStack Router wraps pushState/replaceState so it hears every write; a hidden app's wrapper
		// would re-route that app to the visible page's URL. Wrappers added while an app mounts run
		// only while it is shown; each wrapper calls through to the ones installed before it.
		const wrappers = [];
		const callBelow = level =>
			function ( ...args ) {
				for ( let i = level - 1; i >= 0; i-- ) {
					if ( ! wrappers[ i ].owner || wrappers[ i ].owner === visible ) {
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
			},
		} );
	}

	const placeFrames = () => Object.values( frames ).forEach( placeFrame );
	addEventListener( 'resize', placeFrames );
	document
		.getElementById( 'collapse-button' )
		?.addEventListener( 'click', () => requestAnimationFrame( placeFrames ) );

	listen( 'popstate', event => {
		// Ignore our own synthetic pops; real Back/Forward across pages swaps what is shown.
		if ( event.isTrusted && kindOf( location.href ) && pageOf( location.href ) !== visible ) {
			show( location.href );
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
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey ||
				! kindOf( a.href )
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

	// While idle, get every other page ready to render and load the framed pages, so first visits are instant too.
	const idle = cb => ( window.requestIdleCallback ?? ( f => setTimeout( f, 200 ) ) )( cb );
	const preload = async () => {
		saveSnapshot(
			config.host,
			( apps[ config.host ] ??= document.getElementById( members[ config.host ].mountId ) )
		);
		const menuOrder = [ ...document.querySelectorAll( '#adminmenu a[href]' ) ].map( a =>
			pageOf( a.href )
		);
		const pages = Object.keys( members ).sort(
			( a, b ) => ( menuOrder.indexOf( a ) + 1 || 99 ) - ( menuOrder.indexOf( b ) + 1 || 99 )
		);
		for ( const slug of pages ) {
			if ( slug !== config.host ) {
				await prewarm( slug );
				await new Promise( idle );
			}
		}
		document.querySelectorAll( '#adminmenu a[href]' ).forEach( a => {
			const remembered = rememberedFrameUrl( pageOf( a.href ) );
			if ( remembered && kindOf( a.href ) === 'frame' && pageOf( a.href ) !== visible ) {
				loadFrame( pageOf( a.href ), remembered );
			}
		} );
	};
	addEventListener( 'load', () => setTimeout( () => idle( preload ), 1000 ) );
	document.getElementById( 'adminmenu' )?.addEventListener( 'pointerover', event => {
		const a = event.target.closest?.( 'a[href]' );
		if (
			a &&
			kindOf( a.href ) === 'app' &&
			pageOf( a.href ) !== config.host &&
			document.readyState === 'complete'
		) {
			prewarm( pageOf( a.href ) );
		}
	} );
};
