/**
 * Instant switching between Jetpack admin pages.
 *
 * Every Jetpack page opened from the sidebar stays alive in a full-viewport, same-origin iframe
 * "layer" above the page that was loaded first, so going back to it is a visibility toggle.
 * Each layer keeps its own window and history, so product apps need no integration.
 */

const FRAME_PREFIX = 'jetpack-instant-nav-';
const config = window.jetpackInstantNavConfig || {};
const MAX_LAYERS = config.maxLayers || 8;
const MENU_LINKS = '#toplevel_page_jetpack a';

const isFrame = window.top !== window && window.name.startsWith( FRAME_PREFIX );

/**
 * Identify a Jetpack admin page by its `page` query arg.
 *
 * @param {string} href - Link or location URL.
 * @return {string|null} Page slug, or null when the URL is not a Jetpack admin page.
 */
function pageKey( href ) {
	let url;
	try {
		url = new URL( href, window.location.href );
	} catch {
		return null;
	}
	if ( url.origin !== window.location.origin || ! url.pathname.endsWith( '/admin.php' ) ) {
		return null;
	}
	const page = url.searchParams.get( 'page' );
	return page && ( config.pages || [] ).includes( page ) ? page : null;
}

/**
 * Find the Jetpack menu link a click landed on, if it should switch layers.
 *
 * @param {MouseEvent} event - Click event.
 * @return {HTMLAnchorElement|null} The link.
 */
function menuLinkFrom( event ) {
	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return null;
	}
	const link = event.target.closest?.( MENU_LINKS );
	if ( ! link || ( link.target && link.target !== '_self' ) || ! pageKey( link.href ) ) {
		return null;
	}
	return link;
}

if ( isFrame ) {
	const host = window.top.jetpackInstantNav;
	const key = window.name.slice( FRAME_PREFIX.length );

	document.addEventListener(
		'click',
		event => {
			const link = menuLinkFrom( event );
			if ( link ) {
				event.preventDefault();
				host.go( link.href );
				return;
			}
			// Leaving Jetpack from the frame's chrome replaces the whole tab.
			const chromeLink = event.target.closest?.( '#adminmenuwrap a, #wpadminbar a' );
			if ( chromeLink && ! event.defaultPrevented && ! chromeLink.target && chromeLink.href ) {
				event.preventDefault();
				window.top.location.href = chromeLink.href;
			}
		},
		true
	);

	// A frame's history entries would land in the tab's joint history, where Back steps a frame
	// that may be hidden; keep in-app URL changes in place and mirror them to the tab instead.
	const replaceState = History.prototype.replaceState;
	history.pushState = function ( state, unused, url ) {
		return history.replaceState( state, unused, url );
	};
	history.replaceState = function ( ...args ) {
		const result = replaceState.apply( this, args );
		host.sync( key, window );
		return result;
	};
	window.addEventListener( 'hashchange', () => host.sync( key, window ) );
	document.addEventListener( 'pointerover', event => {
		const link = event.target.closest?.( MENU_LINKS );
		if ( link ) {
			host.prewarm( link.href );
		}
	} );
	host.ready( key, window );
} else if ( window.top === window ) {
	const ownKey = pageKey( window.location.href );
	const layers = new Map(); // key -> { iframe, loaded: Promise, lastShown }
	let visible = ownKey;
	const ownTitle = document.title;
	const pushState = History.prototype.pushState.bind( history );
	const replaceState = History.prototype.replaceState.bind( history );

	const style = document.createElement( 'style' );
	style.textContent = `
		.jetpack-instant-nav-layer { position: fixed; inset: 0; width: 100%; height: 100%; border: 0;
			z-index: 100000; background: #f0f0f1; visibility: hidden; pointer-events: none; }
		.jetpack-instant-nav-layer.is-visible { visibility: visible; pointer-events: auto; }
		html.jetpack-instant-nav-covered, html.jetpack-instant-nav-covered body { overflow: hidden; }
	`;
	document.head.appendChild( style );

	/**
	 * Create (or return) the layer for a page.
	 *
	 * @param {string} key  - Page slug.
	 * @param {string} href - URL to load.
	 * @return {object} Layer.
	 */
	const ensureLayer = ( key, href ) => {
		if ( key === ownKey ) {
			return null;
		}
		let layer = layers.get( key );
		if ( layer ) {
			return layer;
		}
		const iframe = document.createElement( 'iframe' );
		iframe.name = FRAME_PREFIX + key;
		iframe.className = 'jetpack-instant-nav-layer';
		iframe.setAttribute( 'inert', '' );
		iframe.setAttribute( 'title', '' );
		let resolve;
		layer = { iframe, key, lastShown: Date.now(), loaded: new Promise( r => ( resolve = r ) ) };
		iframe.addEventListener( 'load', () => {
			resolve();
			// The frame left its page (a content link, a form post): hand the URL to the whole tab.
			let frameHref;
			try {
				frameHref = iframe.contentWindow.location.href;
			} catch {
				frameHref = null;
			}
			if ( frameHref && frameHref !== 'about:blank' && pageKey( frameHref ) !== key ) {
				if ( key === visible ) {
					window.location.href = frameHref;
				} else {
					// A hidden layer that wandered off (a redirect) must not take over the tab.
					iframe.remove();
					layers.delete( key );
				}
			}
		} );
		iframe.src = href;
		document.body.appendChild( iframe );
		layers.set( key, layer );
		evict( key );
		return layer;
	};

	const evict = keep => {
		const hidden = [ ...layers.values() ]
			.filter( layer => layer.key !== visible && layer.key !== keep )
			.sort( ( a, b ) => a.lastShown - b.lastShown );
		while ( layers.size > MAX_LAYERS && hidden.length ) {
			const layer = hidden.shift();
			layer.iframe.remove();
			layers.delete( layer.key );
		}
	};

	const show = key => {
		visible = key;
		for ( const layer of layers.values() ) {
			const on = layer.key === key;
			layer.iframe.classList.toggle( 'is-visible', on );
			layer.iframe.toggleAttribute( 'inert', ! on );
			if ( on ) {
				layer.lastShown = Date.now();
			}
		}
		const covered = key !== ownKey;
		document.documentElement.classList.toggle( 'jetpack-instant-nav-covered', covered );
		document.getElementById( 'wpwrap' )?.toggleAttribute( 'inert', covered );
		const frameWindow = covered ? layers.get( key )?.iframe.contentWindow : null;
		document.title = frameWindow?.document?.title || ownTitle;
		frameWindow?.focus();
	};

	const host = {
		visibleFrameName: () => ( visible === ownKey ? '' : FRAME_PREFIX + visible ),
		go( href ) {
			const key = pageKey( href );
			if ( ! key ) {
				window.location.href = href;
				return;
			}
			if ( key === visible ) {
				return;
			}
			const url = key === ownKey ? ownUrl : layers.get( key )?.url || href;
			ensureLayer( key, href );
			pushState( { jetpackInstantNav: key }, '', url );
			show( key );
		},
		prewarm( href ) {
			const key = pageKey( href );
			if ( key ) {
				return ensureLayer( key, href )?.loaded;
			}
		},
		ready( key, frameWindow ) {
			const layer = layers.get( key );
			if ( layer && key === visible ) {
				document.title = frameWindow.document.title;
			}
		},
		sync( key, frameWindow ) {
			const layer = layers.get( key );
			if ( ! layer ) {
				return;
			}
			layer.url = frameWindow.location.href;
			if ( key === visible ) {
				replaceState( { jetpackInstantNav: key }, '', layer.url );
				document.title = frameWindow.document.title;
			}
		},
	};
	window.jetpackInstantNav = host;

	let ownUrl = window.location.href;
	// Track the loaded page's own in-app URL changes so returning to it restores them.
	window.addEventListener( 'hashchange', () => {
		if ( visible === ownKey ) {
			ownUrl = window.location.href;
		}
	} );

	replaceState( { ...( history.state || {} ), jetpackInstantNav: ownKey }, '' );

	// Back/Forward between layers: handle it before the loaded page's own router hears it.
	const onHistory = event => {
		// The loaded page's router may rewrite its entries' state, so an unmarked entry is its own.
		const key = history.state?.jetpackInstantNav ?? ownKey;
		const switching = key !== visible;
		if ( key !== ownKey && ! layers.has( key ) ) {
			ensureLayer( key, window.location.href );
		}
		if ( switching || key !== ownKey ) {
			event.stopImmediatePropagation();
		}
		if ( switching ) {
			show( key );
		}
	};
	window.addEventListener( 'popstate', onHistory, true );
	window.addEventListener(
		'hashchange',
		event => {
			if ( visible !== ownKey ) {
				event.stopImmediatePropagation();
			}
		},
		true
	);

	document.addEventListener(
		'click',
		event => {
			const link = menuLinkFrom( event );
			if ( link ) {
				event.preventDefault();
				host.go( link.href );
			}
		},
		true
	);

	// Warm the page a pointer or keyboard is heading for, then the rest of the menu while idle.
	const warmFrom = event => {
		const link = event.target.closest?.( MENU_LINKS );
		if ( link ) {
			host.prewarm( link.href );
		}
	};
	document.addEventListener( 'pointerover', warmFrom, { passive: true } );
	document.addEventListener( 'focusin', warmFrom );

	const idle = window.requestIdleCallback || ( cb => setTimeout( cb, 200 ) );
	window.addEventListener( 'load', () => {
		const queue = [ ...document.querySelectorAll( MENU_LINKS ) ]
			.map( link => link.href )
			.filter( href => pageKey( href ) && pageKey( href ) !== ownKey )
			.slice( 0, MAX_LAYERS );
		const next = () => {
			const href = queue.shift();
			if ( href ) {
				// One at a time, so warming never competes with the page in use.
				Promise.resolve( host.prewarm( href ) ).then( () => idle( next, { timeout: 3000 } ) );
			}
		};
		setTimeout( () => idle( next, { timeout: 3000 } ), config.prewarmDelay ?? 1500 );
	} );
}
