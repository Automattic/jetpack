/*
 * A guest's page data (initial state, its own classic scripts and styles) is fetched the first
 * time it is needed, instead of being built on every member page.
 */

const isPlainObject = value => value && typeof value === 'object' && ! Array.isArray( value );

// Keep the host's values and add the keys only the guest has.
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

const addStylesheet = node =>
	new Promise( resolve => {
		const link = node.cloneNode( true );
		link.onload = link.onerror = resolve;
		document.head.append( link );
	} );

/**
 * Fetch a guest's page data and add what the document doesn't already have.
 *
 * Resolves after the guest's stylesheets load, so the app never renders unstyled.
 *
 * @param {string} endpoint - Guest endpoint URL, nonce included.
 * @param {string} slug     - Guest page slug.
 * @return {Promise<void>} Resolves once applied.
 */
export async function applyGuestAssets( endpoint, slug ) {
	const url = new URL( endpoint, location.href );
	url.searchParams.set( 'member', slug );
	const response = await fetch( url, { credentials: 'same-origin' } );
	const body = await response.json();
	if ( ! response.ok || ! body?.success ) {
		throw new Error( `Admin shell: no page data for ${ slug } (HTTP ${ response.status })` );
	}

	const template = document.createElement( 'template' );
	template.innerHTML = body.data.html;
	// Script modules are already in the host's import map; a second map would be ignored.
	const nodes = template.content.querySelectorAll(
		'link[rel="stylesheet"], style, script:not([type="importmap"]):not([type="module"])'
	);
	const stylesheets = [];
	for ( const node of nodes ) {
		const existing = node.id && document.getElementById( node.id );
		if ( node.tagName === 'LINK' ) {
			if ( ! existing ) {
				stylesheets.push( addStylesheet( node ) );
			}
			continue;
		}
		if ( node.tagName === 'STYLE' ) {
			if ( ! existing ) {
				document.head.append( node.cloneNode( true ) );
			}
			continue;
		}
		if ( node.src ? existing : existing?.textContent === node.textContent ) {
			continue;
		}
		if ( node.id === 'jetpack-script-data-js-before' && window.JetpackScriptData ) {
			const host = window.JetpackScriptData;
			await runScript( node );
			const guest = window.JetpackScriptData;
			window.JetpackScriptData = host;
			mergeInto( host, guest );
			continue;
		}
		await runScript( node );
	}
	await Promise.all( stylesheets );
}
