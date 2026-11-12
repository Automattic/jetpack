/*
 * A stand-in for a page, drawn the moment the page is opened and removed once its app renders:
 * its saved header and tabs, or another page's header with its title. Each page's header, and
 * the CSS it uses, is saved whenever it is on screen: the dashboards add most of their CSS from
 * JavaScript, which hasn't run yet.
 */
import { log } from './debug';

const KEY_ROOT = 'jetpack-admin-shell-header:';
// The longest a stand-in stays up: an app showing no page heading would otherwise stay hidden.
const STAND_IN_TIMEOUT = 8000;

let keyPrefix = KEY_ROOT;
const storageKey = slug => keyPrefix + slug;

/**
 * Set where headers are saved, and drop the ones an earlier release saved for this site and user.
 *
 * @param {string} prefix - `jetpack-admin-shell-header:<blog>:<user>:<version>:`.
 */
export function configureHeaders( prefix ) {
	keyPrefix = prefix;
	const scope = prefix.split( ':' ).slice( 0, 3 ).join( ':' ) + ':';
	try {
		for ( const key of Object.keys( localStorage ) ) {
			const stale = key.startsWith( scope ) && ! key.startsWith( prefix );
			// Keys from before headers were saved per site and user have no blog ID.
			const unscoped = key.startsWith( KEY_ROOT ) && ! /^\d+:/.test( key.slice( KEY_ROOT.length ) );
			if ( stale || unscoped ) {
				localStorage.removeItem( key );
			}
		}
	} catch {
		// Blocked storage: nothing was saved either.
	}
}

// `JetpackLogo` from `@automattic/jetpack-components`, as dashboard headers render it.
const JETPACK_LOGO =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="20" class="jetpack-logo" aria-hidden="true"><path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"/></svg>';

// Stand-ins on screen, by page.
const standIns = new Map();

// Take a stand-in down and give its mount back.
const takeDown = ( slug, entry ) => {
	clearTimeout( entry.timer );
	if ( standIns.get( slug ) === entry ) {
		standIns.delete( slug );
	}
	if ( entry.standIn.isConnected ) {
		entry.standIn.remove();
		entry.el.style.visibility = '';
		log( 'header', `removed stand-in header for ${ slug }` );
	}
};

/**
 * Remove a page's stand-in header, if it has one.
 *
 * @param {string} slug - Page slug.
 */
export function removeHeader( slug ) {
	const entry = standIns.get( slug );
	if ( entry ) {
		takeDown( slug, entry );
	}
}

// A copy of the parts of `node` that hold one of `keep`, and of each kept element whole.
const pruned = ( node, keep ) => {
	const copy = node.cloneNode( false );
	for ( const child of node.children ) {
		if ( keep.includes( child ) ) {
			copy.append( child.cloneNode( true ) );
		} else if ( keep.some( kept => child.contains( kept ) ) ) {
			copy.append( pruned( child, keep ) );
		}
	}
	return copy;
};

// The app's page wrappers, empty, around a copy of its header and tab bar.
const frameOf = el => {
	const h1 = el.querySelector( 'h1' );
	const page = h1?.closest( '.admin-ui-navigable-region' );
	if ( ! page || ! el.contains( page ) ) {
		return null;
	}
	const header = [ ...page.children ].find( child => child.contains( h1 ) );
	const keep = [ header, page.querySelector( '[role="tablist"]' ) ].filter( Boolean );
	let frame = pruned( page, keep );
	for ( let node = page.parentElement; node !== el; node = node.parentElement ) {
		const wrapper = node.cloneNode( false );
		wrapper.append( frame );
		frame = wrapper;
	}
	return frame;
};

// The copy is for looking at only: no ids to collide with the real app's, nothing that runs.
const inertCopy = html => {
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	template.content
		.querySelectorAll( 'script, iframe, frame, object, embed, base, form' )
		.forEach( node => node.remove() );
	for ( const node of template.content.querySelectorAll( '*' ) ) {
		for ( const { name, value } of [ ...node.attributes ] ) {
			const runs = name.startsWith( 'on' ) || name === 'srcdoc' || /^\s*javascript:/i.test( value );
			if ( name === 'id' || runs ) {
				node.removeAttribute( name );
			}
		}
	}
	return template.content;
};

// Every rule that styles one of these classes, or defines design tokens, in grouping rules too.
const rulesFor = classNames => {
	const selectors = [ ...classNames ].map( name => `.${ CSS.escape( name ) }` );
	const pick = ( rules, fromStyleTag ) => {
		let css = '';
		for ( const rule of rules ) {
			if ( rule instanceof CSSStyleRule ) {
				const styled = selectors.some( selector => rule.selectorText.includes( selector ) );
				const definesTokens =
					fromStyleTag && [ ...rule.style ].some( name => name.startsWith( '--wpds-' ) );
				if ( styled || definesTokens ) {
					css += rule.cssText;
				}
			} else if ( rule.cssRules ) {
				const inner = pick( rule.cssRules, fromStyleTag );
				if ( inner ) {
					css += `${ rule.cssText.slice( 0, rule.cssText.indexOf( '{' ) ) }{${ inner }}`;
				}
			}
		}
		return css;
	};
	let css = '';
	for ( const sheet of document.styleSheets ) {
		try {
			css += pick( sheet.cssRules, sheet.ownerNode?.tagName === 'STYLE' );
		} catch {
			// A cross-origin stylesheet can't be read; it is a <link> that loads with the page anyway.
		}
	}
	return css;
};

// The header HTML last saved for each page in this document, so a check doesn't parse storage.
const savedHtml = new Map();

const readSaved = slug => {
	try {
		return JSON.parse( localStorage.getItem( storageKey( slug ) ) );
	} catch {
		return null;
	}
};

/**
 * Save the header an app has on screen, so its next opening can show it straight away.
 *
 * @param {string}      slug - Page slug.
 * @param {HTMLElement} el   - The app's mount element.
 */
export function rememberHeader( slug, el ) {
	const frame = frameOf( el );
	if ( ! frame ) {
		return;
	}
	const html = frame.outerHTML;
	if ( ! savedHtml.has( slug ) ) {
		savedHtml.set( slug, readSaved( slug )?.html );
	}
	if ( savedHtml.get( slug ) === html ) {
		return;
	}
	savedHtml.set( slug, html );
	// Walking every stylesheet takes a few milliseconds; keep it off the click that switches pages.
	( window.requestIdleCallback ?? setTimeout )( () => {
		const classNames = new Set(
			[ frame, ...frame.querySelectorAll( '[class]' ) ].flatMap( node => [ ...node.classList ] )
		);
		const css = rulesFor( classNames );
		log( 'header', `saved ${ slug }'s header with ${ Math.round( css.length / 1024 ) }KB of CSS` );
		try {
			localStorage.setItem( storageKey( slug ), JSON.stringify( { html, css } ) );
		} catch {
			// Storage full or blocked: the next opening shows no stand-in.
		}
	} );
}

// Never opened in this browser: another page's saved frame, stripped to a header with this title.
const borrowed = ( slug, title ) => {
	let saved;
	try {
		// Only a standard page header: a custom one's styles don't survive having its parts taken out.
		saved = Object.keys( localStorage )
			.filter( key => key.startsWith( keyPrefix ) )
			.map( key => ( {
				...JSON.parse( localStorage.getItem( key ) ),
				from: key.slice( keyPrefix.length ),
			} ) )
			.find( entry => entry.html?.includes( '__header-title' ) );
	} catch {
		return null;
	}
	if ( ! saved?.html || ! title ) {
		return null;
	}
	const template = document.createElement( 'template' );
	template.innerHTML = saved.html;
	const h1 = template.content.querySelector( 'h1' );
	if ( ! h1 ) {
		return null;
	}
	template.content
		.querySelectorAll(
			'[role="tablist"], [class*="__header-actions"], [class*="__header-subtitle"]'
		)
		.forEach( node => node.remove() );
	h1.textContent = title;
	// Every Jetpack page header shows the Jetpack logo, whatever icon the borrowed page had.
	let visual = template.content.querySelector( '[class*="__header-visual"]' );
	if ( ! visual ) {
		visual = document.createElement( 'div' );
		visual.style.cssText = 'display:grid;flex-shrink:0;width:24px;height:24px;place-items:center';
		h1.before( visual );
	}
	visual.innerHTML = JETPACK_LOGO;
	// Dashboards scope their page layout to WordPress's per-page body class, which is now this page's.
	const css = saved.css?.replaceAll( `jetpack_page_${ saved.from }`, `jetpack_page_${ slug }` );
	return { html: template.innerHTML, css };
};

/**
 * Show a stand-in for a page in front of its app until the app renders.
 *
 * @param {string}      slug  - Page being opened.
 * @param {HTMLElement} el    - Its mount element; the stand-in goes right before it.
 * @param {string}      title - Page heading, for a page whose header has never been saved.
 * @return {Function} Removes the stand-in.
 */
export function showHeader( slug, el, title ) {
	const saved = readSaved( slug );
	const { html, css } = saved ?? borrowed( slug, title ) ?? {};
	if ( ! html ) {
		log( 'header', `no saved header for ${ slug }` );
		return () => {};
	}

	// A section for the same reason the guest containers are one (see bootGuest in index.js).
	const standIn = document.createElement( 'section' );
	standIn.className = el.className;
	standIn.dataset.shellHeader = slug;
	standIn.inert = true;
	standIn.setAttribute( 'aria-hidden', 'true' );
	standIn.append( inertCopy( html ) );
	if ( css ) {
		const style = document.createElement( 'style' );
		style.textContent = css;
		standIn.prepend( style );
	}
	el.before( standIn );
	// The empty mount can be styled as a blank page that would cover the stand-in.
	el.style.visibility = 'hidden';
	log( 'header', `showing ${ saved ? 'its saved' : 'a borrowed' } header for ${ slug }` );

	removeHeader( slug );
	const entry = { standIn, el, timer: 0 };
	entry.timer = setTimeout( () => takeDown( slug, entry ), STAND_IN_TIMEOUT );
	standIns.set( slug, entry );
	return () => takeDown( slug, entry );
}
