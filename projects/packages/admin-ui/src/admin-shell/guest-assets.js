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

// Every global's current value, to tell which ones a script reassigned.
const globalsSnapshot = () => {
	const values = new Map();
	for ( const key of Object.keys( window ) ) {
		try {
			values.set( key, window[ key ] );
		} catch {
			// A throwing getter: nothing a page script can reassign through `var` either.
		}
	}
	return values;
};

/**
 * Run a guest's inline script, keeping the host's value of every global it reassigns.
 *
 * Guest data printed as `var X = …` would otherwise replace what the host's app reads; objects
 * get the guest's extra keys merged in, so the guest still finds its own data.
 *
 * @param {HTMLScriptElement} node - Inline script.
 * @return {Promise<string[]>} Globals the host kept.
 */
const runInline = async node => {
	const before = globalsSnapshot();
	await runScript( node );
	const kept = [];
	for ( const [ key, hostValue ] of before ) {
		let guestValue;
		try {
			guestValue = window[ key ];
		} catch {
			continue;
		}
		if ( guestValue === hostValue ) {
			continue;
		}
		try {
			window[ key ] = hostValue;
		} catch {
			continue;
		}
		if ( isPlainObject( hostValue ) && isPlainObject( guestValue ) ) {
			mergeInto( hostValue, guestValue );
		}
		kept.push( key );
	}
	return kept;
};

/**
 * Fetch the styles and scripts a guest prints on its own page, without adding them.
 *
 * @param {string} endpoint - Guest endpoint URL, nonce included.
 * @param {string} slug     - Guest page slug.
 * @return {Promise<string>} The HTML.
 */
export async function fetchGuestAssets( endpoint, slug ) {
	const url = new URL( endpoint, location.href );
	url.searchParams.set( 'member', slug );
	const response = await fetch( url, { credentials: 'same-origin' } );
	const body = await response.json();
	if ( ! response.ok || ! body?.success ) {
		throw new Error( `Admin shell: no page data for ${ slug } (HTTP ${ response.status })` );
	}
	return body.data.html;
}

/**
 * Add what a guest's page data has and the document doesn't.
 *
 * Resolves after the guest's stylesheets load, so the app never renders unstyled.
 *
 * @param {string} html - From fetchGuestAssets().
 * @return {Promise<object>} How many scripts and styles were added, how many the page already had, and the style nodes added.
 */
export async function addGuestAssets( html ) {
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	// Script modules are already in the host's import map; a second map would be ignored.
	const nodes = template.content.querySelectorAll(
		'link[rel="stylesheet"], style, script:not([type="importmap"]):not([type="module"])'
	);
	const stylesheets = [];
	// Inserted with async=false, external scripts download in parallel and still run in order.
	let loading = [];
	const added = { scripts: 0, styles: 0, skipped: 0, keptGlobals: [], styleNodes: [] };
	// Inline scripts carry no id when printed without a handle; match those by their text.
	const inlineTexts = new Set(
		[ ...document.querySelectorAll( 'script:not([src])' ) ].map( script => script.textContent )
	);
	for ( const node of nodes ) {
		const existing = node.id && document.getElementById( node.id );
		if ( node.tagName !== 'SCRIPT' ) {
			if ( existing ) {
				added.skipped++;
				continue;
			}
			added.styles++;
			const style = node.cloneNode( true );
			if ( style.tagName === 'LINK' ) {
				stylesheets.push( new Promise( resolve => ( style.onload = style.onerror = resolve ) ) );
			}
			document.head.append( style );
			added.styleNodes.push( style );
			continue;
		}
		if ( node.src ? existing : inlineTexts.has( node.textContent ) ) {
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
		added.keptGlobals.push( ...( await runInline( node ) ) );
	}
	await Promise.all( loading );
	await Promise.all( stylesheets );
	return added;
}

/**
 * Fetch a guest's page data and add what the document doesn't already have.
 *
 * @param {string} endpoint - Guest endpoint URL, nonce included.
 * @param {string} slug     - Guest page slug.
 * @return {Promise<object>} See addGuestAssets().
 */
export async function applyGuestAssets( endpoint, slug ) {
	return addGuestAssets( await fetchGuestAssets( endpoint, slug ) );
}
