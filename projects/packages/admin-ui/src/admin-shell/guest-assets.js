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
 * @return {Promise<object>} How many scripts and styles were added, and how many the page already had.
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
	// Inserted with async=false, external scripts download in parallel and still run in order.
	let loading = [];
	const added = { scripts: 0, styles: 0, skipped: 0 };
	for ( const node of nodes ) {
		const existing = node.id && document.getElementById( node.id );
		if ( node.tagName !== 'SCRIPT' ) {
			if ( existing ) {
				added.skipped++;
				continue;
			}
			added.styles++;
			if ( node.tagName === 'LINK' ) {
				stylesheets.push( addStylesheet( node ) );
			} else {
				document.head.append( node.cloneNode( true ) );
			}
			continue;
		}
		if ( node.src ? existing : existing?.textContent === node.textContent ) {
			added.skipped++;
			continue;
		}
		added.scripts++;
		if ( node.src ) {
			loading.push( runScript( node ) );
			continue;
		}
		// An inline script runs as soon as it is added, so the scripts before it must have run.
		await Promise.all( loading );
		loading = [];
		const host = node.id === 'jetpack-script-data-js-before' && window.JetpackScriptData;
		await runScript( node );
		if ( host ) {
			const guest = window.JetpackScriptData;
			window.JetpackScriptData = host;
			mergeInto( host, guest );
		}
	}
	await Promise.all( loading );
	await Promise.all( stylesheets );
	return added;
}
