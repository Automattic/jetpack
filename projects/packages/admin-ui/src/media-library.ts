/*
 * Load the WordPress media library (`wp.media`) when a dashboard first opens it, instead of on
 * every page load. The endpoint is Media_Library in class-media-library.php.
 */

type MediaLibraryWindow = Window & {
	ajaxurl?: string;
	wp?: { media?: unknown };
};

const AJAX_ACTION = 'jetpack_media_library';

let pending: Promise< void > | null = null;

const isReady = (): boolean =>
	Boolean( ( window as MediaLibraryWindow ).wp?.media ) &&
	Boolean( document.getElementById( 'tmpl-media-modal' ) );

const isJavaScript = ( script: HTMLScriptElement ): boolean =>
	! script.type || /^(text|application)\/(java|ecma)script$/i.test( script.type );

const appendAndWait = ( element: HTMLScriptElement | HTMLLinkElement, url: string ) =>
	new Promise< void >( ( resolve, reject ) => {
		element.addEventListener( 'load', () => resolve() );
		element.addEventListener( 'error', () => {
			// Removed so that a retry adds it again instead of skipping its id.
			element.remove();
			reject( new Error( `Media library: could not load ${ url }` ) );
		} );
		document.head.append( element );
	} );

const runScript = ( node: HTMLScriptElement ): Promise< void > | null => {
	// A script parsed into a template never runs; a fresh one does.
	const script = document.createElement( 'script' );
	for ( const { name, value } of node.attributes ) {
		script.setAttribute( name, value );
	}
	if ( ! node.src ) {
		script.textContent = node.textContent;
		document.head.append( script );
		return null;
	}
	// Inserted with async=false, external scripts download in parallel and still run in order.
	script.async = false;
	return appendAndWait( script, node.src );
};

/**
 * Add the endpoint's markup to the document, skipping what it already has, in the order it was printed.
 *
 * @param html - Styles, scripts and templates.
 */
async function insert( html: string ): Promise< void > {
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	const loading: Promise< void >[] = [];
	for ( const node of template.content.querySelectorAll< HTMLElement >(
		'link[rel="stylesheet"], style, script'
	) ) {
		if ( node.id && document.getElementById( node.id ) ) {
			continue;
		}
		if ( node instanceof HTMLLinkElement ) {
			loading.push( appendAndWait( node.cloneNode( true ) as HTMLLinkElement, node.href ) );
		} else if ( node instanceof HTMLScriptElement && isJavaScript( node ) ) {
			if ( ! node.src ) {
				// An inline script runs as soon as it is added, so the scripts before it must have run.
				await Promise.all( loading );
			}
			const loaded = runScript( node );
			if ( loaded ) {
				loading.push( loaded );
			}
		} else {
			// Styles and `text/html` templates.
			document.body.append( node.cloneNode( true ) );
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
	url.searchParams.set( 'action', AJAX_ACTION );
	const response = await fetch( url, { credentials: 'same-origin' } );
	const body = await response.json().catch( () => null );
	if ( ! response.ok || ! body?.success || typeof body.data?.html !== 'string' ) {
		throw new Error( `Media library: could not load (HTTP ${ response.status })` );
	}
	await insert( body.data.html );
	if ( ! isReady() ) {
		throw new Error( 'Media library: wp.media is not defined after loading' );
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
	if ( isReady() ) {
		return Promise.resolve();
	}
	pending ??= load().catch( error => {
		pending = null;
		throw error;
	} );
	return pending;
}
