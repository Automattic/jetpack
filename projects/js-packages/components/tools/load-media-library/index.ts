/*
 * Load the WordPress media library (`wp.media`) when a dashboard first opens it, instead of on
 * every page load. The endpoint is Media_Library in the automattic/jetpack-admin-ui package.
 */

type MediaLibraryWindow = Window & {
	ajaxurl?: string;
	wp?: { media?: { view?: { MediaFrame?: unknown } } };
};

const AJAX_ACTION = 'jetpack_media_library';

// Each dashboard bundles its own copy of this module, so the load in flight lives on `window`.
const PENDING = Symbol.for( 'jetpack.media-library' );

const TIMEOUT_MS = 30000;

const pendingSlot = () => window as unknown as Record< symbol, Promise< void > | undefined >;

const isReady = (): boolean =>
	Boolean( ( window as MediaLibraryWindow ).wp?.media?.view?.MediaFrame ) &&
	Boolean( document.getElementById( 'tmpl-media-modal' ) );

/**
 * Handles the page loaded through core's concatenated load-scripts.php or load-styles.php, whose tags carry no per-handle id.
 *
 * @param file - `load-scripts.php` or `load-styles.php`.
 * @return Comma-separated handles.
 */
const concatenatedHandles = ( file: string ): string => {
	const handles: string[] = [];
	for ( const element of document.querySelectorAll< HTMLScriptElement | HTMLLinkElement >(
		'script[src], link[rel="stylesheet"][href]'
	) ) {
		const url = new URL( 'src' in element ? element.src : element.href, window.location.href );
		if ( ! url.pathname.endsWith( `/${ file }` ) ) {
			continue;
		}
		// Core cuts the handle list into fixed-length chunks, which can split a handle in two.
		const list = [ ...url.searchParams ]
			.filter( ( [ key ] ) => key.startsWith( 'load' ) )
			.map( ( [ , value ] ) => value )
			.join( '' );
		handles.push( ...list.split( ',' ).filter( Boolean ) );
	}
	return handles.join( ',' );
};

// Libraries whose second copy would replace the page's, for pages that concatenate scripts some other way.
const PAGE_GLOBALS: Record< string, () => unknown > = {
	'jquery-core-js': () => ( window as { jQuery?: unknown } ).jQuery,
	'underscore-js': () => ( window as { _?: unknown } )._,
	'backbone-js': () => ( window as { Backbone?: unknown } ).Backbone,
	'wp-hooks-js': () => ( window as { wp?: { hooks?: unknown } } ).wp?.hooks,
	'wp-i18n-js': () => ( window as { wp?: { i18n?: unknown } } ).wp?.i18n,
};

const isOnPage = ( node: HTMLElement ): boolean =>
	Boolean( node.id && ( document.getElementById( node.id ) || PAGE_GLOBALS[ node.id ]?.() ) );

const isJavaScript = ( script: HTMLScriptElement ): boolean =>
	! script.type || /^(text|application)\/(java|ecma)script$/i.test( script.type );

/**
 * Add an external script or stylesheet and wait for it.
 *
 * @param element  - The element to add.
 * @param url      - Its URL, for the error message.
 * @param required - Whether a failure fails the load. A missing stylesheet only looks wrong.
 * @return A promise that settles once it loads or fails.
 */
const appendAndWait = (
	element: HTMLScriptElement | HTMLLinkElement,
	url: string,
	required: boolean
): Promise< void > => {
	return new Promise< void >( ( resolve, reject ) => {
		const fail = () => {
			clearTimeout( timer );
			if ( required ) {
				reject( new Error( `Media library: could not load ${ url }` ) );
			} else {
				resolve();
			}
		};
		const timer = setTimeout( fail, TIMEOUT_MS );
		element.addEventListener( 'load', () => {
			clearTimeout( timer );
			resolve();
		} );
		element.addEventListener( 'error', fail );
		document.head.append( element );
	} );
};

/**
 * Add the endpoint's markup to the document, skipping what it already has, in the order it was printed.
 *
 * @param html  - Styles, scripts and templates.
 * @param added - Collects every element added, so a failed load can take them out again.
 */
async function insert( html: string, added: Element[] ): Promise< void > {
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	const loading: Promise< void >[] = [];
	const wait = ( promise: Promise< void > ) => {
		// Handled by Promise.all below; this only keeps an early failure from being reported as unhandled.
		promise.catch( () => {} );
		loading.push( promise );
	};
	for ( const node of template.content.querySelectorAll< HTMLElement >(
		'link[rel="stylesheet"], style, script'
	) ) {
		if ( isOnPage( node ) ) {
			continue;
		}
		if ( node instanceof HTMLLinkElement ) {
			const link = node.cloneNode( true ) as HTMLLinkElement;
			added.push( link );
			wait( appendAndWait( link, node.href, false ) );
		} else if ( node instanceof HTMLScriptElement && isJavaScript( node ) ) {
			// A script parsed into a template never runs; a fresh one does.
			const script = document.createElement( 'script' );
			for ( const { name, value } of node.attributes ) {
				script.setAttribute( name, value );
			}
			added.push( script );
			if ( node.src ) {
				// Inserted with async=false, external scripts download in parallel and still run in order.
				script.async = false;
				wait( appendAndWait( script, node.src, true ) );
				continue;
			}
			// An inline script runs as soon as it is added, so the scripts before it must have run.
			await Promise.all( loading );
			script.textContent = node.textContent;
			document.head.append( script );
		} else {
			// Styles and `text/html` templates.
			const copy = node.cloneNode( true ) as Element;
			added.push( copy );
			document.body.append( copy );
		}
	}
	await Promise.all( loading );
}

/**
 * Fetch the media library's scripts and templates, and run them.
 */
async function load(): Promise< void > {
	const { ajaxurl } = window as MediaLibraryWindow;
	if ( ! ajaxurl ) {
		throw new Error( 'Media library: ajaxurl is not defined' );
	}
	const url = new URL( ajaxurl, window.location.href );
	// The response's scripts run on this page, so they must come from it.
	if ( url.origin !== window.location.origin ) {
		throw new Error( 'Media library: ajaxurl is on another origin' );
	}
	url.searchParams.set( 'action', AJAX_ACTION );
	// From Page_Handles in automattic/jetpack-admin-ui. Posted, since it's long.
	let printed: { scripts?: string[]; styles?: string[] } = {};
	try {
		printed = JSON.parse( document.getElementById( 'jetpack-page-handles' )?.textContent ?? '{}' );
	} catch {
		// Fall back to the load-scripts.php URLs.
	}
	const response = await fetch( url, {
		method: 'POST',
		body: new URLSearchParams( {
			scripts: printed.scripts?.join( ',' ) ?? concatenatedHandles( 'load-scripts.php' ),
			styles: printed.styles?.join( ',' ) ?? concatenatedHandles( 'load-styles.php' ),
		} ),
		credentials: 'same-origin',
		signal: AbortSignal.timeout( TIMEOUT_MS ),
	} );
	const body = await response.json().catch( () => null );
	if ( ! response.ok || ! body?.success || typeof body.data?.html !== 'string' ) {
		throw new Error( `Media library: could not load (HTTP ${ response.status })` );
	}
	const added: Element[] = [];
	try {
		await insert( body.data.html, added );
		if ( ! isReady() ) {
			throw new Error( 'Media library: wp.media is not defined after loading' );
		}
	} catch ( error ) {
		// Taken out so that a retry runs everything again instead of skipping their ids.
		added.forEach( element => element.remove() );
		throw error;
	}
}

/**
 * Load the media library once. Resolves when `wp.media` and its templates are ready.
 *
 * Rejects when it can't be loaded; a later call tries again.
 *
 * @return A promise that resolves when `wp.media` can open a frame.
 */
export function loadMediaLibrary(): Promise< void > {
	const slot = pendingSlot();
	const pending = slot[ PENDING ];
	if ( pending ) {
		return pending;
	}
	if ( isReady() ) {
		return Promise.resolve();
	}
	slot[ PENDING ] = load().catch( error => {
		delete slot[ PENDING ];
		throw error;
	} );
	return slot[ PENDING ];
}
