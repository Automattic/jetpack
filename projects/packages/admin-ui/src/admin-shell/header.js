/*
 * A stand-in for a page, drawn the moment the page is opened and removed once its app renders:
 * its saved header and tabs, or another page's header with its title and subtitle. Each page's
 * header, and the CSS it uses, is saved whenever it is on screen: the dashboards add most of their
 * CSS from JavaScript, which hasn't run yet. Its CSS rules and style attributes are saved once, under
 * one key, for every page that uses them: the dashboards share most of them.
 */
import { log } from './debug';

const KEY_ROOT = 'jetpack-admin-shell-header:';
// The longest a stand-in stays up: an app showing no page heading would otherwise stay hidden.
const STAND_IN_TIMEOUT = 8000;

// Saved CSS names the page by this, not its body class, so another page can borrow it.
const PAGE_CLASS = 'jetpack-admin-shell-page';

let keyPrefix = KEY_ROOT;
let bodyClassOf = () => null;
const storageKey = slug => keyPrefix + slug;
// Not a page slug, which is a sanitized key.
const piecesKey = () => keyPrefix + '*';

/**
 * Set where headers are saved, and drop the ones an earlier release saved for this site and user.
 *
 * @param {string} prefix  - `jetpack-admin-shell-header:<blog>:<user>:<version>:`.
 * @param {object} members - Member config keyed by slug, for each page's body class.
 */
export function configureHeaders( prefix, members = {} ) {
	keyPrefix = prefix;
	bodyClassOf = slug => members[ slug ]?.bodyClass;
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

const readJson = key => {
	try {
		return JSON.parse( localStorage.getItem( key ) );
	} catch {
		return null;
	}
};

const pageKeys = () =>
	Object.keys( localStorage ).filter( key => key.startsWith( keyPrefix ) && key !== piecesKey() );

// Saved markup has a piece's id for each style attribute's value.
const STYLE_ATTRIBUTE = /\sstyle="([^"]*)"/g;
const piecesOf = ( { html, css } ) => [
	...css,
	...[ ...String( html ).matchAll( STYLE_ATTRIBUTE ) ].map( ( [ , id ] ) => id ),
];

// Name each piece by the id the same text already has, or a new one.
const namer = pieces => {
	const ids = new Map( Object.entries( pieces ).map( ( [ id, text ] ) => [ text, id ] ) );
	let next = Math.max( -1, ...Object.keys( pieces ).map( id => parseInt( id, 36 ) ) ) + 1;
	return text => {
		if ( ! ids.has( text ) ) {
			ids.set( text, ( next++ ).toString( 36 ) );
			pieces[ ids.get( text ) ] = text;
		}
		return ids.get( text );
	};
};

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

// The app's page wrappers, empty, around a copy of its header and tab bar, and the elements copied.
const frameOf = el => {
	const h1 = el.querySelector( 'h1' );
	const page = h1?.closest( '.admin-ui-navigable-region' );
	// A screen that hides its header, such as Boost's Getting Started, would lend other pages an invisible one.
	if ( ! page || ! el.contains( page ) || h1.checkVisibility?.() === false ) {
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
	const copied = new Set();
	for ( const kept of keep ) {
		for ( let node = kept.parentElement; node !== el; node = node.parentElement ) {
			copied.add( node );
		}
		[ kept, ...kept.querySelectorAll( '*' ) ].forEach( node => copied.add( node ) );
	}
	return { frame, copied: [ ...copied ] };
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

// A selector matches no element while it names a pseudo-element.
const PSEUDO_ELEMENT =
	/::?(before|after|marker|placeholder|selection|backdrop|first-line|first-letter|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)/g;

const matchesAny = ( selector, nodes ) => {
	const plain = selector.replace( PSEUDO_ELEMENT, '' );
	try {
		return nodes.some( node => node.matches( plain ) );
	} catch {
		return false;
	}
};

/*
 * Every rule that applies to one of these elements, or defines design tokens on the page, each inside
 * its own copy of its grouping rules so pages that share it save the same text.
 */
const rulesFor = nodes => {
	const selectors = [ ...new Set( nodes.flatMap( node => [ ...node.classList ] ) ) ].map(
		name => `.${ CSS.escape( name ) }`
	);
	const roots = [ document.documentElement, document.body ];
	const found = [];
	const pick = ( rules, wrap, fromStyleTag ) => {
		for ( const rule of rules ) {
			if ( rule instanceof CSSStyleRule ) {
				// The class test is cheap and rules out most rules before the real one.
				const styled =
					selectors.some( selector => rule.selectorText.includes( selector ) ) &&
					matchesAny( rule.selectorText, nodes );
				const definesTokens =
					fromStyleTag &&
					[ ...rule.style ].some( name => name.startsWith( '--wpds-' ) ) &&
					matchesAny( rule.selectorText, roots );
				if ( styled || definesTokens ) {
					found.push( wrap( rule.cssText ) );
				}
			} else if ( rule.cssRules ) {
				const head = rule.cssText.slice( 0, rule.cssText.indexOf( '{' ) );
				pick( rule.cssRules, css => wrap( `${ head }{${ css }}` ), fromStyleTag );
			}
		}
	};
	for ( const sheet of document.styleSheets ) {
		try {
			pick( sheet.cssRules, css => css, sheet.ownerNode?.tagName === 'STYLE' );
		} catch {
			// A cross-origin stylesheet can't be read; it is a <link> that loads with the page anyway.
		}
	}
	return found;
};

// The header HTML last saved for each page in this document, so a check doesn't parse storage.
const savedHtml = new Map();

// A page's saved header with its pieces filled in, or null if any of them is gone.
const readSaved = slug => {
	const saved = readJson( storageKey( slug ) );
	if ( ! Array.isArray( saved?.css ) ) {
		return null;
	}
	const pieces = readJson( piecesKey() ) ?? {};
	if ( ! piecesOf( saved ).every( id => Object.hasOwn( pieces, id ) ) ) {
		return null;
	}
	const template = document.createElement( 'template' );
	template.innerHTML = saved.html;
	for ( const node of template.content.querySelectorAll( '[style]' ) ) {
		node.setAttribute( 'style', pieces[ node.getAttribute( 'style' ) ] );
	}
	return { html: template.innerHTML, css: saved.css.map( id => pieces[ id ] ).join( '' ) };
};

// Save a page's header and the pieces it names, and drop the pieces no page uses any more.
const write = ( slug, saved, pieces ) => {
	const used = [ saved ];
	try {
		for ( const key of pageKeys() ) {
			const record = key !== storageKey( slug ) && readJson( key );
			if ( Array.isArray( record?.css ) ) {
				used.push( record );
			}
		}
		const kept = {};
		for ( const id of used.flatMap( piecesOf ) ) {
			kept[ id ] = pieces[ id ];
		}
		localStorage.setItem( piecesKey(), JSON.stringify( kept ) );
		localStorage.setItem( storageKey( slug ), JSON.stringify( saved ) );
	} catch {
		// Storage full or blocked: the next opening shows no stand-in.
		try {
			localStorage.removeItem( storageKey( slug ) );
		} catch {
			// Blocked: nothing was saved either.
		}
	}
};

/**
 * Save the header an app has on screen, so its next opening can show it straight away.
 *
 * @param {string}      slug - Page slug.
 * @param {HTMLElement} el   - The app's mount element.
 */
export function rememberHeader( slug, el ) {
	const { frame, copied } = frameOf( el ) ?? {};
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
		// Rules are matched against the elements on screen: once the app redraws, save it next time.
		if ( ! copied.every( node => node.isConnected ) ) {
			savedHtml.delete( slug );
			return;
		}
		const pieces = readJson( piecesKey() ) ?? {};
		const add = namer( pieces );
		for ( const node of [ frame, ...frame.querySelectorAll( '[style]' ) ] ) {
			if ( node.hasAttribute( 'style' ) ) {
				node.setAttribute( 'style', add( node.getAttribute( 'style' ) ) );
			}
		}
		const bodyClass = bodyClassOf( slug );
		// Dashboards scope their page layout to WordPress's per-page body class.
		const pageScoped = bodyClass && new RegExp( `\\b${ bodyClass }(?![\\w-])`, 'g' );
		const css = rulesFor( copied ).map( rule =>
			add( pageScoped ? rule.replace( pageScoped, PAGE_CLASS ) : rule )
		);
		log( 'header', `saved ${ slug }'s header with ${ css.length } CSS rules` );
		write( slug, { html: frame.outerHTML, css }, pieces );
	} );
}

// A saved standard page header: a custom one's styles don't survive having parts taken out.
const donor = () => {
	try {
		const entries = pageKeys()
			.sort()
			// The markup only: the saved CSS names classes the markup may not use.
			.map( key => [ key, String( readJson( key )?.html ?? '' ) ] )
			.filter( ( [ , html ] ) => html.includes( '__header-title' ) );
		const has = ( ...marks ) =>
			entries.find( ( [ , html ] ) => marks.every( mark => html.includes( mark ) ) );
		// `JetpackLogo` as it last rendered, so this file needs no copy of it, best with a subtitle row.
		const [ key ] =
			has( 'jetpack-logo', '__header-subtitle' ) ?? has( 'jetpack-logo' ) ?? entries[ 0 ] ?? [];
		return key ? readSaved( key.slice( keyPrefix.length ) ) : null;
	} catch {
		return null;
	}
};

// CSS modules hash only a class name's prefix; these are found by their `__<name>` ending.
const ROW_CLASSES = [ 'header-subtitle', 'body-md' ];
let rowClasses = null;

// The classes of a subtitle row, from the styles on the page: one walk, then remembered.
const findRowClasses = () => {
	const pattern = new RegExp( `\\.([\\w-]+__(${ ROW_CLASSES.join( '|' ) }))(?![\\w-])`, 'g' );
	const found = {};
	const search = rules => {
		for ( const rule of rules ) {
			for ( const [ , name, suffix ] of rule.selectorText?.matchAll( pattern ) ?? [] ) {
				found[ suffix ] ??= name;
			}
			if ( rule.cssRules ) {
				search( rule.cssRules );
			}
		}
	};
	for ( const sheet of document.styleSheets ) {
		try {
			search( sheet.cssRules );
		} catch {
			// A cross-origin stylesheet can't be read.
		}
	}
	// Not remembered when missing: the styles may still be on their way.
	const all = ROW_CLASSES.map( suffix => found[ suffix ] );
	return all.includes( undefined ) ? null : all;
};

/*
 * A subtitle row as admin-ui's Page renders it, for a copy saved without one. Any page header on
 * screen has added its styles, with or without a subtitle; before that, there is no row.
 */
const subtitleRow = copy => {
	const content = copy.querySelector( '[class*="__header-content"]' );
	rowClasses ??= content && findRowClasses();
	if ( ! content || ! rowClasses ) {
		return null;
	}
	// The heading's text and element-reset classes, without its size and role.
	const shared = [ ...copy.querySelector( 'h1' ).classList ].filter(
		name => ! /__(heading-\w+|header-title)$/.test( name )
	);
	const row = document.createElement( 'p' );
	row.className = [ ...shared, ...rowClasses ].join( ' ' );
	content.after( row );
	return row;
};

// Give a header copy this page's title, and its subtitle or none.
const retitle = ( copy, { title, subtitle }, own ) => {
	copy.querySelector( 'h1' ).textContent = title;
	const row = copy.querySelector( '[class*="__header-subtitle"]' );
	// Picked as the page renders: keep the page's own row, or hold a blank line for it.
	if ( subtitle === null ) {
		if ( ! ( own && row ) ) {
			( row ?? subtitleRow( copy ) )?.replaceChildren( '\u00a0' );
		}
		return;
	}
	if ( ! subtitle ) {
		row?.remove();
		return;
	}
	// The page's own row may follow the subtitle with more, such as Forms' help link: keep it.
	if ( own && row?.textContent.startsWith( subtitle ) ) {
		return;
	}
	const target = row ?? subtitleRow( copy );
	if ( target ) {
		target.textContent = subtitle;
	}
};

/**
 * Show a stand-in for a page in front of its app until the app renders.
 *
 * @param {string}      slug     - Page being opened.
 * @param {HTMLElement} el       - Its mount element; the stand-in goes right before it.
 * @param {string}      title    - Page heading, for a borrowed header.
 * @param {object|null} declared - `title` and `subtitle` of the view being opened, when the page
 *                               declares them: they replace those of any header shown. A null
 *                               `subtitle` keeps a line for one the page picks as it renders.
 * @return {Function} Removes the stand-in.
 */
export function showHeader( slug, el, title, declared = null ) {
	const own = readSaved( slug );
	const saved = own ?? ( title ? donor() : null );
	if ( ! saved?.html ) {
		log( 'header', `no saved header for ${ slug }` );
		return () => {};
	}
	const copy = inertCopy( saved.html );
	if ( ! own ) {
		// Another page's: only its icon and layout are this page's too.
		copy
			.querySelectorAll( '[role="tablist"], [class*="__header-actions"]' )
			.forEach( node => node.remove() );
	}
	if ( ! own || declared ) {
		retitle( copy, declared ?? { title }, !! own );
	}
	const css = saved.css?.replaceAll( PAGE_CLASS, bodyClassOf( slug ) ?? PAGE_CLASS );

	// A section for the same reason the guest containers are one (see bootGuest in index.js).
	const standIn = document.createElement( 'section' );
	standIn.className = el.className;
	standIn.dataset.shellHeader = slug;
	standIn.inert = true;
	standIn.setAttribute( 'aria-hidden', 'true' );
	standIn.append( copy );
	if ( css ) {
		const style = document.createElement( 'style' );
		style.textContent = css;
		standIn.prepend( style );
	}
	el.before( standIn );
	// The empty mount can be styled as a blank page that would cover the stand-in.
	el.style.visibility = 'hidden';
	log( 'header', `showing ${ own ? 'its saved' : 'a borrowed' } header for ${ slug }` );

	removeHeader( slug );
	const entry = { standIn, el, timer: 0 };
	entry.timer = setTimeout( () => takeDown( slug, entry ), STAND_IN_TIMEOUT );
	standIns.set( slug, entry );
	return () => takeDown( slug, entry );
}
